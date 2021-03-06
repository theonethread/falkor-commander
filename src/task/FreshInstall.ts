import { Task } from "@falkor/falkor-library";

type TNpmJsonResponseItem = {
    name: string;
    scope: string;
    version: string; // SemVer
    description: string;
    keywords: string[];
    date: Date;
    links: {
        npm: string;
        homepage?: string;
        repository?: string;
        bugs?: string;
    };
    author:
        | string
        | {
              name?: string;
              url?: string;
          };
    publisher: {
        username: string;
        email: string;
    };
    maintainers: {
        username: string;
        email: string;
    }[];
};

class FreshInstall extends Task {
    protected registry: string;
    protected scope: string;
    protected keyword: string;

    constructor() {
        super("Fresh Install" /*, { npm: "8", node: "16" }*/);
    }

    public async run(argv?: { [key: string]: any }, config?: any): Promise<void> {
        this.registry = argv?.r || argv?.registry || config?.registry || "https://registry.npmjs.org";
        this.scope = argv?.s || argv?.scope || config?.scope || "@falkor";
        this.keyword = argv?.k || argv?.keyword || config?.keyword || "@falkor-plugin";

        this.logger.info(
            `searching npm registry '${this.theme.formatPath(this.registry)}' for scope '${this.theme.formatPath(
                this.scope
            )}' and keyword '${this.theme.formatPath(this.keyword)}'`
        );
        const searchReturn = await this.exec(`npm search --json --registry "${this.registry}" "${this.scope}"`);
        if (!searchReturn.success) {
            this.error("failed npm search");
        }

        const candidates = (JSON.parse(searchReturn.result.out) as TNpmJsonResponseItem[]).filter((p) =>
            p.keywords?.includes(this.keyword)
        );
        if (candidates.length) {
            return this.offerInstall(candidates);
        }

        this.logger.info(this.theme.formatWarning("no plugin candidates found, exiting"));
    }

    public async offerInstall(candidates: TNpmJsonResponseItem[]): Promise<void> {
        const answers: string[] = [];
        const descriptions: string[] = [];
        candidates.forEach((p) => {
            answers.push(p.name);
            descriptions.push(p.version);
        });
        const installAnswer = (await this.ask(
            `Would you like to install any of the found plugins? ${this.theme.formatTrace("(select none to exit)")}`,
            {
                answers,
                descriptions,
                list: true,
                multi: true,
                allowNone: true
            }
        )) as string[];
        if (installAnswer === null) {
            return this.error("failed input");
        }
        if (!installAnswer.length) {
            this.logger.info("no plugin selected");
            return;
        }

        for (const plugin of installAnswer) {
            this.subtask(`installing plugin '${this.theme.formatPath(plugin)}'`);
            const installReturn = await this.exec(`npm install ${plugin} --global`);
            if (!installReturn.success) {
                return this.error("failed npm install");
            }
            this.success("installed");
        }
        this.logger.info("plugins installed");
    }
}

export default new FreshInstall();
