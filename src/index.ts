import minimist from "minimist";

// NOTE: differentiate between positional arguments, and options passed after "--" POSIX separator
const argv = minimist(process.argv.slice(2), { "--": true, string: ["--", "_"] });
if (argv.v || argv.version) {
    (await import("./cli/index-cli.js")).default(true);
    process.exit(0);
}
if (argv.h || argv.help) {
    (await import("./cli/index-cli.js")).default();
    process.exit(0);
}

const FalkorCommander = (await import("./commander/FalkorCommander.js")).default;
export default new FalkorCommander(argv);
