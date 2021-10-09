import path from "path";

import falkor from "@falkor/falkor-library";

type PluginDescriptor = {
    name: string;
    version: string;
};

class FalkorCommander extends falkor.TaskRunner {
    protected readonly moduleParams = this.getModuleParameters(import.meta.url, "..");

    constructor() {
        super("Commander");

        this.init();
    }

    protected async init(): Promise<void> {
        this.startSubtask("Initialization");
        await this.initPlugins();
        this.endSubtaskSuccess("done");

        process.exit(0);
    }

    protected async initPlugins(): Promise<void> {
        const pluginRoot = path.join(this.moduleParams.root, "/node_modules/@falkor/plugin-*");
        this.logger.notice(`using plugin pattern: ${this.theme.formatPath(pluginRoot)}`);

        const pluginList = this.shell.ls(pluginRoot);
        if (pluginList.length === 0) {
            this.logger.warning(`no plugins found ${this.theme.formatNotice("(assuming fresh install)")}`);
            return this.freshInstall();
        }

        for (const dirSegment of pluginList) {
            const dir = path.join(pluginRoot, dirSegment);
            if (!this.shell.test("-d", dir)) {
                this.logger.warning(`not a directory from '${this.theme.formatDebug(dir)}'`);
                continue;
            }
            this.logger.notice(`testing directory '${this.theme.formatDebug(dirSegment)}'`).pushPrompt();
            let descriptor: PluginDescriptor;
            try {
                const pkg = JSON.parse(this.shell.cat(path.join(dir, "package.json")));
                descriptor = {
                    name: pkg.name,
                    version: pkg.version
                };
            } catch (e) {
                this.logger.warning(`failed to load plugin info from '${this.theme.formatDebug(dir)}'`).popPrompt();
                continue;
            }
            this.logger.notice(`importing module '${this.theme.formatDebug(descriptor.name)}' (${descriptor.version})`);
            let moduleExports;
            try {
                moduleExports = (await import(descriptor.name)).default;
            } catch (e) {
                this.logger.warning(`failed to import module '${this.theme.formatDebug(descriptor.name)}'`).popPrompt();
                continue;
            }
            if (!Array.isArray(moduleExports)) {
                moduleExports = [moduleExports];
            }

            this.logger.notice("processing default exports").pushPrompt();
            for (const item of moduleExports) {
                if (item instanceof falkor.Task) {
                    this.register(item);
                    this.logger.notice(
                        `${this.theme.formatSuccess("registered")} task '${this.theme.formatPath(item.id)}'`
                    );
                } else {
                    this.logger
                        .notice(
                            `${this.theme.formatWarning("dropping export")}, not instance of '${this.theme.formatDebug(
                                "falkor.Task"
                            )}'`
                        )
                        .debug(`input: ${item}`);
                }
            }
            this.logger.popPrompt().notice("done with module").popPrompt();
        }
    }

    protected freshInstall(): void {
        this.startSubtask("Fresh Install");

        // TODO

        this.endSubtaskSuccess("success");
    }
}

export default new FalkorCommander();
