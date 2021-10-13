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

        // TODO
    }

    protected async initPlugins(): Promise<void> {
        let descriptorArr;
        this.logger.notice(`testing if 'cwd' is plugin (${this.theme.formatPath(this.cwd)})`);
        const pluginTestPkg = this.testPackage(this.cwd);
        if (pluginTestPkg) {
            this.logger.notice(`'cwd' is plugin, running in test mode`);
            descriptorArr = [pluginTestPkg];
        } else {
            this.logger.notice(`'cwd' is not plugin, discovering scope ${this.theme.formatPath("@falkor")}`);
            descriptorArr = this.testModule(this.cwd, "@falkor");
            if (descriptorArr.length === 0) {
                this.logger.warning(`no plugins found ${this.theme.formatNotice("(assuming fresh install)")}`);
                return this.freshInstall();
            }
        }

        for (const descriptor of descriptorArr) {
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
        this.logger.notice("processing default exports");
        moduleExports.forEach((item) => {
            if (item instanceof falkor.Task) {
                this.register(item);
                this.logger.notice(
                    `${this.theme.formatSuccess("registered")} task '${this.theme.formatDebug(item.id)}'`
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
