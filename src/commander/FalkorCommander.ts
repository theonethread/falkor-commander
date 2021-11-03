import minimist from "minimist";
import { util as falkorUtil, FalkorError } from "@falkor/falkor-library";
import PluginTaskRunner from "../task/PluginTaskRunner.js";

const enum FalkorCommanderErrorCodes {
    MISSING_BUFFERED_TASK = "commander-buffered-error"
}

export default class FalkorCommander extends PluginTaskRunner {
    protected startTime: [number, number];

    constructor(argv: minimist.ParsedArgs) {
        super("Commander", argv["--"]?.length ? argv["--"] : null);
        delete argv["--"];
        this.taskBuffer = argv._.length ? argv._ : null;
        delete argv._;
        this.scope = argv.s || argv.scope || this.config.external?.commander?.scope || "@falkor";
        delete argv.s;
        delete argv.scope;
        this.keyword = argv.k || argv.keyword || this.config.external?.commander?.keyword || "@falkor-plugin";
        delete argv.k;
        delete argv.keyword;
        this.forcedPluginPath = argv.p || argv.path || this.config.external?.commander?.path || null;
        delete argv.p;
        delete argv.path;
        if (Object.keys(argv).length === 0) {
            argv = null;
        }
        this.initArgv = argv;

        this.logger
            .pushPrompt(this.debugPrompt)
            .debug(`${this.theme.formatBullet("TASK BUFFER:")} ${JSON.stringify(this.taskBuffer)}`)
            .debug(`${this.theme.formatBullet("ARGV:")} ${JSON.stringify(this.initArgv)}`)
            .popPrompt();

        this.startTime = process.hrtime();
        this.main()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }

    protected handleError(error: Error): Error | FalkorError {
        if (!this.subtaskTitles.length) {
            this.logger
                .fatal(`${this.errorPrompt} ${this.prefix} Commander failed`)
                .debug(`${this.debugPrompt} ${error.stack ? error.stack : error.name + ": " + error.message}`)
                .error(
                    `${this.prefix} ${this.theme.formatTask(this.appName)} error ${this.theme.formatInfo(
                        `(${error.message} ${this.theme.formatTrace(
                            `in ${falkorUtil.prettyTime(process.hrtime(this.startTime))}`
                        )})`
                    )}`
                );
            throw error;
        }

        return this.handleError(super.handleError(error, true));
    }

    protected async main(): Promise<void> {
        await super.main();

        if (this.singlePluginMode) {
            this.logger.info(`${this.infoPrompt} starting single plugin mode`);
            return this.run(null, this.pluginArgv);
        } else if (this.taskBuffer) {
            const missingTasks = this.taskBuffer.filter((id) => !this.collection[id]);
            if (missingTasks.length) {
                this.logger.error(
                    `${this.errorPrompt} missing user buffered task(s): ${this.theme.formatDebug(
                        missingTasks.toString()
                    )}`
                );
                this.handleError(
                    new FalkorError(
                        FalkorCommanderErrorCodes.MISSING_BUFFERED_TASK,
                        "FalkorCommander: missing user buffered task(s)"
                    )
                );
            }
            this.logger.info(
                `${this.infoPrompt} running user buffered task(s): ${this.theme.formatDebug(
                    this.taskBuffer.toString()
                )}`
            );
            return this.run(this.taskBuffer, this.pluginArgv);
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
        await this.run(selection, this.pluginArgv);
        return this.selectLoop(selectableTasks);
    }

    protected async select(question: string, answers: string[]): Promise<string> {
        const selection = (await this.terminal.ask(question, {
            // NOTE: exit is a restricted task ID, so safe to concat
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
}
