import { posix as path } from "path";
import { pathToFileURL } from "url";

import minimist from "minimist";
import falkor from "@falkor/falkor-library";

type PluginDescriptor = {
    name: string;
    version: string;
    module: string;
};

class FalkorCommander extends falkor.TaskRunner {
    constructor() {
        super("Commander");

        const argv = minimist(process.argv.slice(2));
        this.logger
            .pushPrompt(this.theme.formatDebug(this.debugPrompt))
            .debug(`${this.theme.formatSeverityError(0, "ARGV:")} ${JSON.stringify(argv)}`)
            .popPrompt();

        this.main().then(() => process.exit(0));
    }

    protected async main(): Promise<void> {
        this.startSubtask("Initialization");
        await this.initPlugins();
        this.endSubtaskSuccess("done");

        const loadedTasks = Object.keys(this.collection).sort();
        switch (loadedTasks.length) {
            case 0:
                this.logger.info(
                    `${this.infoPrompt} no plugins found ${this.theme.formatNotice("(assuming fresh install)")}`
                );
                return this.freshInstall();
            case 1:
                this.logger.info(
                    `${this.infoPrompt} only one plugin found ${this.theme.formatNotice("(starting automatically)")}`
                );
                return this.run(loadedTasks);
            default:
                return this.run(await this.select(loadedTasks));
        }
    }

    protected async freshInstall(): Promise<void> {
        this.startSubtask("Fresh Install");
        // TODO
        this.logger.debug("// TODO");
        this.endSubtaskSuccess("success");
    }

    protected async select(loadedTasks: string[]): Promise<string | string[]> {
        this.startSubtask("Plugin Selection");
        const answer = await this.terminal.ask("try multi-selection:", {
            answers: loadedTasks,
            list: true,
            multi: true
        });
        if (answer === null) {
            this.endSubtaskError("failed input");
        }
        this.endSubtaskSuccess("success");

        return answer;
    }

    protected async initPlugins(): Promise<void> {
        this.logger.notice(`testing if 'cwd' is plugin (${this.theme.formatPath(this.cwd)})`);
        const pluginTestPkg = this.testPackage(this.cwd);
        if (pluginTestPkg) {
            this.logger.info(`'cwd' is plugin, running in test mode`);
            await this.testPlugin(pluginTestPkg);
            return;
        }

        this.logger.notice(`'cwd' is not plugin, discovering scope ${this.theme.formatPath("@falkor")}`);

        for (const descriptor of this.testModule(this.cwd, "@falkor")) {
            await this.testPlugin(descriptor);
        }
    }

    protected testPackage(dir: string): PluginDescriptor {
        const pkgPath = path.join(dir, "package.json");
        if (this.shell.test("-f", pkgPath)) {
            try {
                const pkg = JSON.parse(this.shell.cat(pkgPath));
                if (
                    pkg.keywords &&
                    Array.isArray(pkg.keywords) &&
                    pkg.keywords.some((k: string) => k === "@falkor-plugin")
                ) {
                    return {
                        name: pkg.name,
                        version: pkg.version,
                        module: pathToFileURL(path.join(dir, pkg.module)).toString()
                    };
                }
            } catch (e) {}
        }
        return null;
    }

    protected testModule(dir: string, scope: string): PluginDescriptor[] {
        const ret: PluginDescriptor[] = [];
        let prev: string;
        do {
            const modulePath = path.join(dir, "node_modules", scope);
            this.logger.debug(`testing module path ${this.theme.formatPath(modulePath)}`);
            if (this.shell.test("-d", modulePath)) {
                this.shell.ls("-AL", modulePath).forEach((d) => {
                    const testPath = path.join(modulePath, d);
                    this.logger.notice(`testing module directory ${this.theme.formatPath(testPath)}`);
                    const candidate = this.testPackage(testPath);
                    if (candidate) {
                        ret.push(candidate);
                    }
                });
            }
            prev = dir;
            dir = path.join(dir, "..");
        } while (prev !== dir && dir !== ".");
        return ret;
    }

    protected async testPlugin(descriptor: PluginDescriptor): Promise<void> {
        this.logger.notice(`importing module '${this.theme.formatDebug(descriptor.name)}' (${descriptor.version})`);
        let moduleExports;
        try {
            moduleExports = (await import(descriptor.module)).default;
        } catch (e) {
            this.logger.warning(`failed to import module '${this.theme.formatDebug(descriptor.name)}'`).debug(e);

            return;
        }
        if (!Array.isArray(moduleExports)) {
            moduleExports = [moduleExports];
        }
        moduleExports.forEach((item) => {
            if (item instanceof falkor.Task) {
                this.register(item);
                this.logger.info(`${this.theme.formatSuccess("registered")} task '${this.theme.formatDebug(item.id)}'`);
                return;
            }
            //#if _DEBUG
            // NOTE: instanceof check can cause trouble while developing with linked local packages, they may have their
            // separate library installations on disk, since symlinked modules' dependencies do not get deduped
            if (Object.prototype.toString.call(item) === "[object @FalkorTask]") {
                this.logger.warning(
                    `assuming '${this.theme.formatDebug(item.id)}' is Falkor task, but not instance of used library`
                );
                try {
                    this.register(item);
                    this.logger.info(
                        `${this.theme.formatSuccess("registered")} task '${this.theme.formatDebug(item.id)}'`
                    );
                    return;
                } catch (e) {}
            }
            //#endif
            this.logger.debug(
                `failed to process item of '${this.theme.formatError(falkor.util.getClassChain(item).join(" < "))}'`
            );
        });
    }
}

export default new FalkorCommander();
