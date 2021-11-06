import process from "process";
import minimist from "minimist";

// NOTE: differentiate between positional arguments, and options passed after "--" POSIX separator
const argv = minimist(process.argv.slice(2), { "--": true, string: ["--", "_"] });
await (async () => {
    let version = argv.v || argv.version;
    if (version || argv.h || argv.help) {
        (await import("./cli/index-cli.js")).default(import.meta.url, version);
        process.exit(0);
    }
})();

const FalkorCommander = (await import("./commander/FalkorCommander.js")).default;
export default new FalkorCommander(argv);
