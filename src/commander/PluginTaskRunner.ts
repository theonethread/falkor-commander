import { posix as path } from "path";
import { pathToFileURL } from "url";
import minimist from "minimist";
import { TaskRunner, Task, util as falkorUtil } from "@falkor/falkor-library";

type PluginDescriptor = {
    name: string;
    version: string;
    module: string;
};

export default class PluginTaskRunner extends TaskRunner {
    private readonly spaceRe = / /g;
    private readonly argvReplacerRe = /^:. /;
    protected scope: string;
    protected keyword: string;
    protected forcedPluginPath: string;
    protected taskBuffer: string[];
    protected initArgv: { [key: string]: any };
    protected pluginArgv: { [key: string]: minimist.ParsedArgs } = {};
    //#ifnset _NO_PLUGIN_TEST
    protected singlePluginMode = false;
    //#endif

    public register(task: Task): void {
        if (this.taskBuffer && !this.taskBuffer.includes(task.id)) {
            this.logger.info(
                `${this.theme.formatWarning(`${this.warningPrompt} skipped`)} task '${this.theme.formatDebug(
                    task.id
                )}' (not present in ${this.theme.formatBullet("TASK BUFFER")})`
            );
            return;
        }
        super.register(task);
        if (this.initArgv) {
            const safeTaskId = task.id.replace(this.spaceRe, "-").toLowerCase();
            if (this.initArgv[safeTaskId]) {
                let argvStr = this.initArgv[safeTaskId];
                let replacer = "#";
                if (this.argvReplacerRe.test(argvStr)) {
                    replacer = argvStr[1];
                    argvStr = argvStr.substr(3);
                }
                this.pluginArgv[task.id] = minimist(
                    falkorUtil.cliTokenize(argvStr.replace(new RegExp("\\" + replacer, "g"), "-")),
                    { "--": true }
                );
            }
        }
        this.logger.info(`${this.theme.formatSuccess("registered")} task '${this.theme.formatDebug(task.id)}'`);
    }

    protected async main(): Promise<void> {
        this.startSubtask("Initialization");
        await this.initPlugins();
        this.endSubtaskSuccess("done");
    }

    protected async initPlugins(): Promise<void> {
        let descriptorArr: PluginDescriptor[];
        if (this.forcedPluginPath) {
            this.logger.notice(`using forced plugin path '${this.theme.formatPath(this.forcedPluginPath)}''`);
            //#ifnset _NO_PLUGIN_TEST
            const pluginTestPkg = this.testPackage(this.forcedPluginPath);
            if (pluginTestPkg) {
                this.logger.info(`forced path is plugin, running in single-plugin mode`);
                this.singlePluginMode = true;
                descriptorArr = [pluginTestPkg];
            } else {
                //#endif
                this.logger.notice(
                    `testing forced plugin path '${this.theme.formatPath(
                        this.forcedPluginPath
                    )}' with required keyword '${this.theme.formatPath(this.keyword)}'`
                );
                descriptorArr = this.testModule(this.forcedPluginPath);
                //#ifnset _NO_PLUGIN_TEST
            }
            //#endif
        } else {
            //#ifnset _NO_PLUGIN_TEST
            const pluginTestPkg = this.testPackage(this.cwd);
            if (pluginTestPkg) {
                this.logger.info(`'cwd' is plugin, running in single-plugin mode`);
                this.singlePluginMode = true;
                descriptorArr = [pluginTestPkg];
            } else {
                //#endif
                this.logger.notice(
                    `resolving scope '${this.theme.formatPath(
                        this.scope
                    )}' with required keyword '${this.theme.formatPath(this.keyword)}'`
                );
                descriptorArr = this.resolveModule(this.cwd);
                //#ifnset _NO_PLUGIN_TEST
            }
            //#endif
        }

        for (const descriptor of descriptorArr) {
            await this.testPlugin(descriptor);
        }

        delete this.initArgv;
    }

    protected testPackage(dir: string): PluginDescriptor {
        const pkgPath = path.join(dir, "package.json");
        if (this.shell.test("-f", pkgPath)) {
            try {
                const pkg = JSON.parse(this.shell.cat(pkgPath));
                if (
                    pkg.keywords &&
                    Array.isArray(pkg.keywords) &&
                    pkg.keywords.some((k: string) => k === this.keyword)
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

    protected resolveModule(dir: string): PluginDescriptor[] {
        const ret: PluginDescriptor[] = [];
        let prev: string;
        do {
            const moduleDir = path.join(dir, "node_modules", this.scope);
            ret.push(...this.testModule(moduleDir));
            prev = dir;
            dir = path.join(dir, "..");
        } while (prev !== dir && dir !== ".");
        return ret;
    }

    protected testModule(dir: string): PluginDescriptor[] {
        const ret: PluginDescriptor[] = [];
        this.logger.debug(`testing path ${this.theme.formatPath(dir)}`);
        if (this.shell.test("-d", dir)) {
            this.shell.ls("-AL", dir).forEach((d) => {
                const testPath = path.join(dir, d);
                this.logger.notice(`testing module ${this.theme.formatPath(testPath)}`);
                const candidate = this.testPackage(testPath);
                if (candidate) {
                    ret.push(candidate);
                }
            });
        }
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
            if (item instanceof Task) {
                this.register(item);
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
                    return;
                } catch (e) {}
            }
            //#endif
            this.logger.debug(
                `failed to process item of '${this.theme.formatError(falkorUtil.getClassChain(item).join(" < "))}'`
            );
        });
    }
}
