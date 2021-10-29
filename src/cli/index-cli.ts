import getOwnVersion from "./version.js";

export default (short = false) => {
    if (short) {
        console.log("falkor-commander version", getOwnVersion());
        return;
    }

    console.log(`
[Falkor Commander]
version ${getOwnVersion()}
(C)2020-2021 Barnabas Bucsy - All rights reserved.

Description

Usage:
  falkor-commander [(--scope <scope>)] [(--keyword <keyword>)] [<tasks>...] [(-- <answers>...)]
  falkor-commander [(--s <scope>)] [(--k <keyword>)] [<tasks>...] [(-- <answers>...)]
  falkor-commander (-v | --version | -h | --help)

Options:
  -v, --version                      Show version and exit
  -h, --help                         Show this screen and exit
  -s <scope>, --scope <scope>        The scope to look for plugins under 'node_modules' [default: @falkor]
  -k <keyword>, --keyword <keyword>  The keyword to look for in plugin candidates' 'package.json' [default: @falkor-plugin]
  <tasks>...                         Treat all positional arguments as buffered task IDs
  -- <answers>...                    Treat all positional arguments after double dash as buffered input
`);
};
