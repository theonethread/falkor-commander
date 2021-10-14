import { posix as path } from "path";
import { pathToFileURL } from "url";

import falkor from "@falkor/falkor-library";

type PluginDescriptor = {
    name: string;
    version: string;
    module: string;
};

class FalkorCommander extends falkor.TaskRunner {
    constructor() {
        super("Commander");

        this.init();
    }

    protected async init(): Promise<void> {
        this.startSubtask("Initialization");
        await this.initPlugins();
        this.endSubtaskSuccess("done");

        const loadedTasks = Object.keys(this.collection);
        if (loadedTasks.length === 0) {
            this.logger.warning(`no plugins found ${this.theme.formatNotice("(assuming fresh install)")}`);
            return this.freshInstall();
        }

        // TODO
        return this.run();
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
            const proto = Object.getPrototypeOf(item);
            const className = proto.constructor.name;
            const subclassName = Object.getPrototypeOf(proto).constructor.name;
            if (item instanceof falkor.Task) {
                this.register(item);
                this.logger.info(`${this.theme.formatSuccess("registered")} task '${this.theme.formatDebug(item.id)}'`);
            } /*#if _DEBUG*/ else if (subclassName === "Task" && typeof item.id === "string") {
                // NOTE: instanceof can cause trouble while developing with linked local packages, they may have their separate
                // library instances installed on disk, since symlinked modules' dependencies do not get deduped
                this.logger.warning(
                    `assuming '${this.theme.formatDebug(item.id)}' is Task, but not instance of local Falkor library`
                );
                try {
                    this.register(item);
                } catch (e) {
                    return;
                }
                this.logger.info(`${this.theme.formatSuccess("registered")} task '${this.theme.formatDebug(item.id)}'`);
            } /*#endif*/ else {
                this.logger.debug(
                    `failed to process instance of '${this.theme.formatError(
                        className
                    )}' (subclass of '${this.theme.formatError(subclassName)}')`
                );
            }
        });
    }

    protected freshInstall(): void {
        this.startSubtask("Fresh Install");

        // TODO

        this.endSubtaskSuccess("success");
    }
}

export default new FalkorCommander();
