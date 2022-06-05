import path from "path";
import { fileURLToPath } from "url";
import shell from "shelljs";

// index.js gets generated to the .dist directory, we walk upwards from there:
const getOwnVersion = (fileUrl: string) =>
    JSON.parse(shell.cat(path.join(path.dirname(fileURLToPath(fileUrl)), "..", "package.json"))).version;

export default (fileUrl: string, short: boolean = false) => {
    if (short) {
        console.log("falkor-commander version", getOwnVersion(fileUrl));
        return;
    }

    console.log(`
[Falkor Commander]
version ${getOwnVersion(fileUrl)}
(C)2020-2022 Barnabas Bucsy - All rights reserved.

Falkor plugin based task runner / -sequencer - part of the Falkor Framework

Usage:
  falkor-commander [(--scope <scope>) | (--path <path>)] [(--keyword <keyword>)] [(--registry <registry>)] [<tasks>...] [(-- <answers>...)]
  falkor-commander [(-s <scope>) | (-p <path>)] [(-k <keyword>)] [(-r <registry>)] [<tasks>...] [(-- <answers>...)]
  falkor-commander (-v | --version | -h | --help)

Options:
  -v, --version                         Show version and exit
  -h, --help                            Show this screen and exit
  -s <scope>, --scope <scope>           The scope to look for plugins under 'node_modules' [default: @falkor]
  -p <path>, --path <path>              Explicit directory to look for plugins in (overrides scope setting)
  -k <keyword>, --keyword <keyword>     The keyword to look for in plugin candidates' 'package.json' [default: @falkor-plugin]
  -r <registry>, --registry <registry>  Registry to use when searching for plugins at fresh install [default: https://registry.npmjs.org]
  <tasks>...                            Treat all positional arguments as buffered task IDs
  -- <answers>...                       Treat all positional arguments after double dash as buffered input

Task Specific Options:
  It is possible to forward command line arguments to individual tasks exposed by plugins. To compose
  such option, one has to use the task's escaped ID (spaces replaced with dashes, all lowercase) after
  double dash, so eg. "Example Task" becomes "--example-task".

  The value of such an option is similar to command line options, only using '#' instead of '-', eg:
  "##value ##key example" will be passed to the specific task's "run" method as { value: true, key: "example" }.

  If for some reason the '#' character is reserved in your workflow, it can be substituted with an other
  special character starting the value with the ':<special-char> ' sequence, eg. ":$ $$value $$key example".
`);
};
