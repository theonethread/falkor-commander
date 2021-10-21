# **Falkor Operations Commander**

[![Npm Keywords](https://img.shields.io/github/package-json/keywords/theonethread/falkor-commander "Keywords")](https://www.npmjs.com/package/@falkor/falkor-commander "Visit") &nbsp;
[![Npm Package](https://img.shields.io/npm/v/@falkor/falkor-commander "Npm")](https://www.npmjs.com/package/@falkor/falkor-commander "Visit") &nbsp;
[![Node Version](https://img.shields.io/node/v/@falkor/falkor-commander "Node")](https://nodejs.org/ "Visit") &nbsp;
[![CI](https://img.shields.io/github/workflow/status/theonethread/falkor-commander/Falkor%20CI%20-%20Develop "CI")](https://github.com/theonethread/falkor-bundler/actions "Visit") &nbsp;
[![Activity](https://img.shields.io/github/last-commit/theonethread/falkor-commander "Activity")](https://github.com/theonethread/falkor-bundler "Visit") &nbsp;
[![Falkor Bundler](https://img.shields.io/npm/dependency-version/@falkor/falkor-commander/dev/@falkor/falkor-bundler "Falkor Bundler")](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") &nbsp;
[![Snyk Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/theonethread/falkor-commander "Snyk")](https://snyk.io/test/github/theonethread/falkor-commander "Visit") &nbsp;
[![License](https://img.shields.io/npm/l/@falkor/falkor-commander "MIT")](https://github.com/theonethread/falkor-bundler/blob/master/license.txt "Visit")

```javascript
// Work In Progress
```

## **Further Development**

The project uses the [`@falkor/falkor-bundler`](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") module to compile sources. You can run:

```
$ npm run [ debug | release ]
```

> _**SEE**: `"scripts"` entry in [`package.json`](https://github.com/theonethread/falkor-commander/blob/master/package.json "Open")_

### **Man Page**

By default the `falkor-commander` project ships with pre-compiled man pages when installed on Unix-like operating systems. The manuals were created by converting the files [`man/man.md`](https://github.com/theonethread/falkor-commander/blob/master/man/man.md "Open") and [`man/shell.md`](https://github.com/theonethread/falkor-commander/blob/master/man/shell.md "Open").

To recompile the manuals, make sure that [`Pandoc`](https://pandoc.org/ "Visit") is installed, and present in the `PATH`, then run:

```
$ npm run man
```

### **Versioning and Branching Strategy**

Release sources can be found on the `master` branch, this one always points to the latest tagged release. Previous sources of releases' can be found using Git version tags (or browsing GitHub releases). Released packages can be found on [npmjs](https://www.npmjs.com/package/@falkor/falkor-commander "Visit").

The repository's main branch is `develop` (due to technical reasons), this holds all developments that are already decided to be included in the next release. Usually this branch is ahead of master one patch version (but based on upcoming features to include this can become minor, or major), so prepared external links may yet be broken.

The `feature/*` branches usually hold ideas and POC code, these will only be merged into `develop` once their impact measured and quality meets release requirements.

> _The project uses [SemVer](https://semver.org "Visit"), Git tags are prefixed with a `v` character._

### **GitHub Actions**

Automatic builds are achieved via GitHub actions, CI will make nightly builds of the `develop` branch (using Ubuntu image), and thoroughly test `master` when there is a pull request, or commit on it (using Ubuntu - Win - MacOS image matrix). The workflows can be found [here](https://github.com/theonethread/falkor-commander/blob/develop/.github/workflows "Open").

### **Open Source**

The latest sources can always be found on [GitHub](https://github.com/theonethread/falkor-commander "Visit").

### **License**

[MIT](https://github.com/theonethread/falkor-commander/blob/master/license.txt "Open")

_©2020-2021 Barnabas Bucsy - All rights reserved._
