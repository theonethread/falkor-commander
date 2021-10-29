import minimist from "minimist";

let scope = "@falkor";
let keyword = `@falkor-plugin`;
// NOTE: differentiate between positional arguments, and options passed after "--" POSIX separator
const argv = minimist(process.argv.slice(2), { "--": true, string: "--" });
if (argv.v || argv.version) {
    (await import("./cli/index-cli.js")).default(true);
    process.exit(0);
}
if (argv.h || argv.help) {
    (await import("./cli/index-cli.js")).default();
    process.exit(0);
}
Object.keys(argv).forEach((arg) => {
    switch (arg) {
        case "s":
        case "scope":
            if (typeof argv[arg] !== "string" || !/^@/.test(argv[arg])) {
                console.log(
                    `'scope: -${arg.length > 1 ? "-" : ""}${arg}' must be string starting with '@' (using argument: ${
                        argv[arg]
                    })`
                );
                process.exit(1);
            }
            scope = argv[arg];
            break;

        case "k":
        case "keyword":
            if (typeof argv[arg] !== "string") {
                console.log(
                    `'keyword: -${arg.length > 1 ? "-" : ""}${arg}' must be string (using argument: ${argv[arg]})`
                );
                process.exit(1);
            }
            keyword = argv[arg];
            break;
    }
});

const FalkorCommander = (await import("./commander/FalkorCommander.js")).default;
export default new FalkorCommander(scope, keyword, argv);
