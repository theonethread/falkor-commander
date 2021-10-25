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
  falkor-commander
  falkor-commander
  falkor-commander (-v | --version | -h | --help)

Options:
  -v, --version  Show version and exit
  -h, --help     Show this screen and exit
`);
};
