% FALKOR-COMMANDER(1) The Falkor Framework **1.0.0** | **Falkor** General Commands Manual
% Barnabas Bucsy
% October 2021

# NAME

**falkor-commander** - Excerpt

# SYNOPSIS

```
falkor-commander [(--scope <scope>)] [(--keyword <keyword>)] [(-- <answers>...)]
falkor-commander [(--s <scope>)] [(--k <keyword>)] [(-- <answers>...)]
falkor-commander (-v | --version | -h | --help)
```

# DESCRIPTION

Description

# OPTIONS

`-v`, `--version`
:   Show version and exit

`-h`, `--help`
:   Show help and exit

`-s <scope>`, `--scope <scope>`
:   The scope to look for plugins under **node_modules** (default: **@falkor**)

`-k <keyword>`, `--keyword <keyword>`
:   The keyword to look for in plugin candidates' **package.json** (default: **@falkor-plugin**)

`-- <answers>...`
:   Treat all positional arguments after double dash as buffered input

# COPYRIGHT

(C)2020-2021 Barnabas Bucsy - All rights reserved.
