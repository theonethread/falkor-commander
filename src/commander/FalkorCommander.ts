import process from "process";
import minimist from "minimist";
import { FalkorError, FalkorExitCode } from "@falkor/falkor-library";
import PluginTaskRunner from "../commander/PluginTaskRunner.js";

const enum FalkorCommanderErrorCodes {
    MISSING_BUFFERED_TASK = "commander-buffered-missing",
    TASK_SELECTION_FAILURE = "commander-selection-failure"
}

export default class FalkorCommander extends PluginTaskRunner {
    protected commanderPrefix: string;
    protected registry: string;
    protected startTime: bigint;
    protected handlingPluginError: boolean = false;

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
        this.registry =
            argv.r || argv.registry || this.config.external?.commander?.registry || "https://registry.npmjs.org";
        delete argv.r;
        delete argv.registry;
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

        this.commanderPrefix = `${this.prefix} ${this.theme.formatTask(this.appName)}`;
        // we want to do one last elapsed time formatting after a final error / abort
        this.times.push(process.hrtime.bigint());
        this.finalTimeCount = 2;
        this.main()
            .then(() => this.exit(0))
            .catch((e) => this.exit(this.getErrorCode(e)));
    }

    /** @throws Error | FalkorError */
    protected handleError(error: Error, soft: boolean = false): Error | FalkorError {
        if (!this.subtaskTitles.length) {
            this.logger
                .fatal(`${this.errorPrompt} ${this.commanderPrefix} failed`)
                .error(`${this.errorPrompt} ${error.message}`)
                .debug(`${this.debugPrompt} ${error.stack ? error.stack : error.name + ": " + error.message}`);

            if (soft) {
                // received SIGINT, this is handled outside of the async main function
                this.exit(2);
            }

            throw error;
        }

        return this.handleError(super.handleError(error, true), soft);
    }

    protected async main(): Promise<void> {
        await super.main();

        //#ifnset _NO_PLUGIN_TEST
        if (this.singlePluginMode) {
            this.logger.info(`${this.infoPrompt} starting single plugin mode`);
            return this.run(null, this.pluginArgv);
        }
        //#endif

        if (this.taskBuffer) {
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
                        "missing user buffered task(s)",
                        FalkorExitCode.VALIDATION,
                        "Commander"
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
        const freshInstallTask = (await import("../task/FreshInstall.js")).default;
        this.register(freshInstallTask);
        if (
            !(this.config.external?.tasks && this.config.external.tasks[freshInstallTask.id]) &&
            !this.pluginArgv[freshInstallTask.id]
        ) {
            this.logger.info(
                `no settings for '${this.theme.formatDebug(freshInstallTask.id)}', injecting task arguments`
            );
            this.pluginArgv[freshInstallTask.id] = {
                registry: this.registry,
                scope: this.scope,
                keyword: this.keyword,
                _: []
            };
        }
        await this.run(null, this.pluginArgv);
    }

    /** @throws FalkorError: FalkorCommanderErrorCodes.TASK_SELECTION_FAILURE */
    protected async selectLoop(selectableTasks: string[]): Promise<void> {
        const selection = (await this.terminal.ask("Select task to run:", {
            // NOTE: exit is a restricted task ID, so safe to concat
            answers: selectableTasks.concat("exit"),
            list: true
        })) as string;
        if (selection === null) {
            this.logger.error("failed selection");
            throw new FalkorError(
                FalkorCommanderErrorCodes.TASK_SELECTION_FAILURE,
                "task selection failure",
                FalkorExitCode.GENERAL,
                "Commander"
            );
        }
        if (selection === "exit") {
            this.logger.info(`${this.infoPrompt} Goodbye!`);
            return;
        }

        await this.run(selection, this.pluginArgv);

        return this.selectLoop(selectableTasks);
    }

    protected exit(code: number): void {
        if (code === 0) {
            this.logger.info(
                `${this.commanderPrefix} ${this.theme.formatSuccess("finished")} (code: 0 ${this.formatElapsedTime()})`
            );
        } else {
            this.logger.info(
                `${this.commanderPrefix} ${this.theme.formatError(
                    "errored"
                )} (code: ${code} ${this.formatElapsedTime()})`
            );
        }
        this.logger.debug(`${this.debugPrompt} exiting with code ${code}`);
        process.exit(code);
    }

    protected getErrorCode(e: Error): number {
        let ret = 1;
        if (e instanceof FalkorError) {
            ret = e.exitCode;
        }
        return ret;
    }
}
