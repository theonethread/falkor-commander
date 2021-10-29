import { posix as path } from "path";
import { pathToFileURL } from "url";

import minimist from "minimist";
import falkor from "@falkor/falkor-library";

type PluginDescriptor = {
    name: string;
    version: string;
    module: string;
};

export default class FalkorCommander extends falkor.TaskRunner {
    private readonly spaceRe = / /g;
    private argvReplacerRe = /^:. /;

    protected taskBuffer: string[];
    protected argv: { [key: string]: any };

    constructor(protected scope: string, protected keyword: string, argv: minimist.ParsedArgs) {
        super("Commander", argv["--"]?.length ? argv["--"] : null);
        delete argv["--"];

        this.taskBuffer = argv._.length ? argv._ : null;
        delete argv._;
        if (Object.keys(argv).length === 0) {
            argv = null;
        }
        this.argv = argv;

        this.logger
            .pushPrompt(this.theme.formatDebug(this.debugPrompt))
            .debug(`${this.theme.formatSeverityError(0, "TASK BUFFER:")} ${JSON.stringify(this.taskBuffer)}`)
            .debug(`${this.theme.formatSeverityError(0, "ARGV:")} ${JSON.stringify(this.argv)}`)
            .popPrompt();

        this.main().then(() => process.exit(0));
    }

    protected async main(): Promise<void> {
        this.startSubtask("Initialization");
        await this.initPlugins();
        this.endSubtaskSuccess("done");

        if (this.taskBuffer) {
            this.logger.info(`${this.infoPrompt} running user buffered tasks`);
            return this.run(this.taskBuffer);
        }

        const loadedTasks = Object.keys(this.collection).sort();
        if (loadedTasks.length === 0) {
            this.logger.info(
                `${this.infoPrompt} no plugins found ${this.theme.formatNotice("(assuming fresh install)")}`
            );
            return this.freshInstall();
        }
        return this.selectLoop(loadedTasks);
    }

    protected async freshInstall(): Promise<void> {
        this.startSubtask("Fresh Install");
        // TODO
        this.logger.debug("// TODO");
        this.endSubtaskSuccess("success");
    }

    protected async selectLoop(selectableTasks: string[]): Promise<void> {
        const selection = await this.select("Select task to run:", selectableTasks);
        await this.run(selection, this.getArgumentsForTasks(selection));
        return this.selectLoop(selectableTasks);
    }

    protected async select(question: string, answers: string[]): Promise<string> {
        const selection = (await this.terminal.ask(question, {
            answers: answers.concat("exit"),
            list: true
        })) as string;
        if (selection === null) {
            this.logger.error("failed selection");
            process.exit(1);
        }
        if (selection === "exit") {
            this.logger.info(`${this.infoPrompt} Goodbye!`).debug(`${this.debugPrompt} exiting`);
            process.exit(0);
        }
        return selection;
    }

    protected async initPlugins(): Promise<void> {
        this.logger.notice(`testing if 'cwd' is plugin (${this.theme.formatPath(this.cwd)})`);
        const pluginTestPkg = this.testPackage(this.cwd);
        if (pluginTestPkg) {
            this.logger.info(`'cwd' is plugin, running in single-plugin test mode`);
            await this.testPlugin(pluginTestPkg);
            return;
        }

        this.logger.notice(
            `'cwd' is not plugin, discovering scope '${this.theme.formatPath(
                this.scope
            )}' with keyword '${this.theme.formatPath(this.keyword)}'`
        );

        for (const descriptor of this.testModule(this.cwd)) {
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

    protected testModule(dir: string): PluginDescriptor[] {
        const ret: PluginDescriptor[] = [];
        let prev: string;
        do {
            const modulePath = path.join(dir, "node_modules", this.scope);
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

    protected getArgumentsForTasks(taskIdArr: string | string[]): { [key: string]: minimist.ParsedArgs } {
        if (!Array.isArray(taskIdArr)) {
            taskIdArr = [taskIdArr];
        }
        const taskVector: { [key: string]: minimist.ParsedArgs } = {};
        if (this.argv) {
            taskIdArr.forEach((taskId) => {
                const safeTaskId = taskId.replace(this.spaceRe, "-").toLowerCase();
                if (this.argv[safeTaskId]) {
                    let argvStr = this.argv[safeTaskId];
                    let replacer = "#";
                    if (this.argvReplacerRe.test(argvStr)) {
                        replacer = argvStr[1];
                        argvStr = argvStr.substr(2);
                    }
                    taskVector[taskId] = minimist(
                        falkor.util.tokenize(argvStr.replace(new RegExp("\\" + replacer, "g"), "-")),
                        {
                            "--": true
                        }
                    );
                }
            });
        }
        return taskVector;
    }
}
