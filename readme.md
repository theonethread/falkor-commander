# **Falkor Operations Commander**

[![Npm Keywords](https://img.shields.io/github/package-json/keywords/theonethread/falkor-commander "Keywords")](https://www.npmjs.com/package/@falkor/falkor-commander "Visit") &nbsp;
[![Npm Package](https://img.shields.io/npm/v/@falkor/falkor-commander "Npm")](https://www.npmjs.com/package/@falkor/falkor-commander "Visit") &nbsp;
[![Node Version](https://img.shields.io/node/v/@falkor/falkor-commander "Node")](https://nodejs.org/ "Visit") &nbsp;
[![Build](https://img.shields.io/github/workflow/status/theonethread/falkor-commander/Falkor%20CI%20-%20Release "Build")](https://github.com/theonethread/falkor-bundler/actions "Visit") &nbsp;
[![Security](https://img.shields.io/github/workflow/status/theonethread/falkor-commander/Falkor%20CI%20-%20Security?label=security "Security")](https://github.com/theonethread/falkor-commander/actions "Visit") &nbsp;
[![Activity](https://img.shields.io/github/last-commit/theonethread/falkor-commander "Activity")](https://github.com/theonethread/falkor-bundler "Visit") &nbsp;
[![Falkor Bundler](https://img.shields.io/npm/dependency-version/@falkor/falkor-commander/dev/@falkor/falkor-bundler "Falkor Bundler")](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") &nbsp;
[![Falkor Library](https://img.shields.io/npm/dependency-version/@falkor/falkor-commander/@falkor/falkor-library "Falkor Library")](https://www.npmjs.com/package/@falkor/falkor-library "Visit") &nbsp;
[![Snyk Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/theonethread/falkor-commander "Snyk")](https://snyk.io/test/github/theonethread/falkor-commander "Visit") &nbsp;
[![License](https://img.shields.io/npm/l/@falkor/falkor-commander "MIT")](https://github.com/theonethread/falkor-bundler/blob/master/license.txt "Visit")

The `falkor-commander` project is a standalone `npm` command-line application written in strict ES6 TypeScript. It is a plugin based task runner / -sequencer using the [`@falkor/falkor-library`](https://www.npmjs.com/package/@falkor/falkor-library "Visit") to make everyday devops tasks more approachable, friendly, and secure in the terminal for non-technical people.

## **Installation**

Install the package globally, so it's available in your `PATH`:

```
$ npm install --global @falkor/falkor-commander
```

## **Usage**

There is an up-to-date testing repository at [`falkor-plugin-example`](https://github.com/theonethread/falkor-plugin-example/tree/master "Visit") to demonstrate framework capabilities, which you can use to test features, or as a boilerplate for your own task sequence.

### **Command Line Interface**

Usage:

```
falkor-commander [(--scope <scope>) | (--path <path>)] [(--keyword <keyword>)] [(--registry <registry>)] [<tasks>...] [(-- <answers>...)]
falkor-commander [(-s <scope>) | (-p <path>)] [(-k <keyword>)] [(-r <registry>)] [<tasks>...] [(-- <answers>...)]
falkor-commander (-v | --version | -h | --help)
```

Options:

* `-v` or `--version`: Show version and exit
* `-h` or `--help`: Show help and exit
* `-s <scope>` or `--scope <scope>`: The scope to look for plugins under `node_modules` (default: `@falkor`)
* `-p <path>` or `--path <path>`: Explicit directory to look for plugins in (overrides scope setting)
* `-k <keyword>` or `--keyword <keyword>`: The keyword to look for in plugin candidates' `package.json` (default: `@falkor-plugin`)
* `-r <registry>` or `--registry <registry>`: Registry to use when searching for plugins at fresh install (default: `https://registry.npmjs.org`)
* `<tasks>...`: Treat all positional arguments as buffered task IDs
* `-- <answers>...`: Treat all positional arguments after double dash as buffered input

Task Specific Options:

It is possible to forward command line arguments to individual tasks exposed by plugins. To compose such option, one has to use the task's escaped ID (spaces replaced with dashes, all lowercase) after double dash, so eg. `Example Task` becomes `--example-task`.

The value of such an option is similar to command line options, only using `#` instead of `-`, so building on the previous example eg.:

```
--example-task "##debug #V #a10 ##key key-value positional-value ## extra-value"
```

This will be parsed by [minimist](https://www.npmjs.com/package/minimist "Visit") after transformation, and passed to the specific task's `run` method as:

```javascript
const argv = {
    debug: true,
    V: true,
    a: 10,
    key: "key-value"
    _: ["positional-value"],
    "--": ["extra-value"]
}
```

If for some reason the `#` character is reserved in your workflow, it can be substituted with an other special character starting the value with the `":<special-char> "` sequence:

```
--example-task ":$ $$debug $V $a10 $$key key-value positional-value $$ extra-value"
```

## **Further Development**

The project uses the [`@falkor/falkor-bundler`](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") module to compile sources. One can use the commands in the root directory after cloning the repository:

```
$ npm install
$ npm run [ debug | release ]
```

> _**SEE**: `"scripts"` entry in [`package.json`](https://github.com/theonethread/falkor-commander/blob/master/package.json "Open")_

### **Man Page**

By default the `falkor-commander` project ships with a pre-compiled man page when installed on Unix-like operating systems. The manual was created by converting the file [`man/man.md`](https://github.com/theonethread/falkor-commander/blob/master/man/man.md "Open").

To recompile the manual, make sure that [`Pandoc`](https://pandoc.org/ "Visit") is installed, and present in the `PATH`, then run:

```
$ npm run man
```

### **Versioning and Branching Strategy**

Release sources can be found on the `master` branch, this one always points to the latest tagged release. Previous sources of releases can be found using Git version tags (or browsing GitHub releases). Released packages can be found on [npmjs](https://www.npmjs.com/package/@falkor/falkor-commander "Visit").

The repository's main branch is `develop` (due to technical reasons), this holds all developments that are already decided to be included in the next release. Usually this branch is ahead of master one patch version (but based on upcoming features to include this can become minor, or major), so prepared external links may yet be broken.

The `feature/*` branches usually hold ideas and POC code, these will only be merged into `develop` once their impact measured and quality meets release requirements.

> _The project uses [SemVer](https://semver.org "Visit"), Git tags are prefixed with a `v` character._

### **GitHub Actions**

The workflows can be found [here](https://github.com/theonethread/falkor-commander/blob/develop/.github/workflows "Open").

#### **Continuous Integration**

Automatic builds are achieved via GitHub actions, CI will make nightly builds of the `develop` branch (using Ubuntu image), and test `master` when there is a pull request, or commit on it (using Ubuntu - Win - MacOS image matrix).

### **Security**

The project uses [CodeQL](https://codeql.github.com "Visit") and [Snyk](https://snyk.io "Visit") to ensure standard security.

> _The **Falkor Framework** supports a healthy and ubiquitous Internet Immune System enabled by security research, reporting, and disclosure. Check out our [Vulnerability Disclosure Policy](https://github.com/theonethread/falkor-commander/security/policy "Open") - based on [disclose.io](https://disclose.io "Visit")'s best practices._

### **Free and Open Source**

The latest sources can always be found on [GitHub](https://github.com/theonethread/falkor-commander "Visit").

#### **Getting Involved**

We believe - and we hope you do too - that learning how to code, how to think, and how to contribute to free- and open source software can empower the next generation of coders and creators. We **value** first time contributors just the same as rock stars of the OSS world, so if you're interested in getting involved, just head over to our [Contribution Guidelines](https://github.com/theonethread/.github/blob/master/.github/contributing.md "Open") for a quick heads-up!

#### **License**

[MIT](https://github.com/theonethread/falkor-commander/blob/master/license.txt "Open")

_©2020-2021 Barnabas Bucsy - All rights reserved._
