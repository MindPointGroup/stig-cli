stig
====

A simple command line interface to read and interface with DISA STIG benchmarks

[![Version](https://img.shields.io/npm/v/stig.svg)](https://npmjs.org/package/stig)
[![Downloads/week](https://img.shields.io/npm/dw/stig.svg)](https://npmjs.org/package/stig)
[![License](https://img.shields.io/npm/l/stig.svg)](https://github.com/defionscode/stig-cli/blob/master/package.json)

# Introduction

This command line utility is intended to help technical folks more easily read through DISA STIG content. Every single solution that currently exists requires folks to use a UI such as the Java based STIG viewer from DISA or stigviewer.com which updates very slowly, neither are open source AFAIK.

This CLI is simple, and while it's built with nodejs it **DOES NOT** require you to have nodejs on your system nor will it conflict with an pre-exisiting nodejs installed on your system. Unless you install directly with `npm -g` the bundle you install from will contain a prebuilt node binary which will be used to invoke the CLI (invisible to you, the end user).

Once you've installed it, updates are super simple with `stig update` and that is it. It will periodically attempt to update itself.

This utility also does not require internet to work. All publicly available benchmarks are bundled in with the source code so there is no need for outbound access for anything other than for updates.

## Table of Contents

<!-- toc -->
* [Introduction](#introduction)
* [Usage](#usage)
* [Commands](#commands)
* [Uninstallation](#uninstallation)
<!-- tocstop -->
* [Visual Examples](#examples)

# Usage

## Installers and standalone tarballs
While this utility is built with node, you do not not need node to use `stig` cli. You can use one of the following sources.

DEB and RPM installers are coming soon.

| System                       | Type   | Download Link      |
|------------------------------|--------|--------------------|
| MacOS                        | tar.gz | [Stable][macostar] |
| MacOS Installer              | pkg    | [Stable][macospkg] |
| Linux ARM                    | tar.gz | [Stable][linuxarm] |
| Linux x64                    | tar.gz | [Stable][linux64]: |
| Windows x64                  | tar.gz | [Stable][win86tar] |
| Windows x86                  | tar.gz | [Stable][win64tar] |
| Windows x86 Installer        | exe    | [Stable][win86exe] |
| Windows x64 Installer        | exe    | [Stable][win64exe] |
| Plain (requires nodejs > 10) | tar.gz | [Stable][vanilla]  |


<!-- usage -->
```sh-session
$ npm install -g stig
$ stig COMMAND
running command...
$ stig (-v|--version|version)
stig/0.1.0-0 darwin-x64 node-v10.7.0
$ stig --help [COMMAND]
USAGE
  $ stig COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`stig autocomplete [SHELL]`](#stig-autocomplete-shell)
* [`stig help [COMMAND]`](#stig-help-command)
* [`stig init`](#stig-init)
* [`stig ls [BENCHMARKID]`](#stig-ls-benchmarkid)
* [`stig read`](#stig-read)
* [`stig update [CHANNEL]`](#stig-update-channel)

## `stig autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ stig autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ stig autocomplete
  $ stig autocomplete bash
  $ stig autocomplete zsh
  $ stig autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.0/src/commands/autocomplete/index.ts)_

## `stig help [COMMAND]`

display help for stig

```
USAGE
  $ stig help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.3/src/commands/help.ts)_

## `stig init`

Initialize the embedded STIG database

```
USAGE
  $ stig init

DESCRIPTION
  This initializes the embedded database will all the STIG data. You MUST run this command in order first before using 
  the rest of the CLI.

  Rerunning this multiple times will delete the current db from disk and recreate it.

  The reason stig cli does not ship with the DB preconfigured is to allow for easier auditing of bundled XCCDF files. 
  You can be certain that the database is based entirely off the XML and hasn't been manipulated in any way other than 
  for some slight formatting changes
```

_See code: [src/commands/init.js](https://github.com/defionscode/stig-cli/blob/v0.1.0-0/src/commands/init.js)_

## `stig ls [BENCHMARKID]`

List STIG Information

```
USAGE
  $ stig ls [BENCHMARKID]

ARGUMENTS
  BENCHMARKID  OPTIONAL: List rules for a specific STIG Benchmark. Supply the ID or title

OPTIONS
  -c, --cats=high|medium|low|all  [default: all] Rule categories to show from. If no arg is supplied, everything is
                                  listed

  --json                          Return results in JSON format

DESCRIPTION
  The 'ls' command is the entry point into reading STIG information.
  When supplied without arguments it returns a list of all available benchmarks.

  Example output

  $ stig ls

    ID   Title                                                    Ver.  Rel.  Date

    1    A10 Networks ADC ALG                                     1     1     Apr 15, 2016

    2    A10 Networks ADC NDM                                     1     1     Apr 15, 2016


  And then if you want to list the rules inside of benchmarks supply the ID number OR the title itself

  Example output
  $ stig ls 1
    STIG ID  Rule ID                                                  Title    Severity

    medium   The A10 Networks ADC must generate an alert to, at a     V-68105  SV-82595r1_rule
             minimum, the ISSO and ISSM when threats identified by
             authoritative sources (e.g., IAVMs or CTOs) are
             detected.

    high     The A10 Networks ADC must be a FIPS-compliant version.   V-68029  SV-82519r1_rule

    medium   The A10 Networks ADC must protect against TCP SYN        V-68027  SV-82517r1_rule
             floods by using TCP SYN Cookies.

  When supplying the title make sure to wrap the title in quotes
  Example output
  $ stig ls 'Windows 10'
    STIG ID  Rule ID                                                  Title    Severity

    high     Administrative accounts must not be used with            V-78129  SV-92835r1_rule
             applications that access the Internet, such as web
             browsers, or with potential Internet sources, such as
             email.

    medium   Exploit Protection mitigations in Windows 10 must be     V-77269  SV-91965r2_rule
             configured for wordpad.exe.

    medium   Exploit Protection mitigations in Windows 10 must be     V-77267  SV-91963r2_rule
             configured for wmplayer.exe.

  If you want only certain severities you can pass the --cats/-c flag. By default it returns all the rules. If you do 
  `-c high -c` low it will only return low and high.

  Example output
  $ stig ls 'Windows 10' -c high

    STIG ID  Rule ID                                                  Title    Severity

    high     Administrative accounts must not be used with            V-78129  SV-92835r1_rule
             applications that access the Internet, such as web
             browsers, or with potential Internet sources, such as
             email.

    high     Structured Exception Handling Overwrite Protection       V-68849  SV-83445r4_rule
             (SEHOP) must be enabled.

    high     Data Execution Prevention (DEP) must be configured to    V-68845  SV-83439r2_rule
             at least OptOut.

EXAMPLES
  stig ls
  stig ls 200
  stig ls "Windows 10"
  stig ls "Windows 10" -c low -c medium
```

_See code: [src/commands/ls.js](https://github.com/defionscode/stig-cli/blob/v0.1.0-0/src/commands/ls.js)_

## `stig read`

Read one or more rules

```
USAGE
  $ stig read

OPTIONS
  -b, --benchmarkId=benchmarkId   Benchmark ID

  -c, --cats=high|medium|low|all  [default: all] Rule categories to show from. If no arg is supplied, everything is
                                  listed

  -r, --ruleId=ruleId             Rule ID

  -v, --vulnId=vulnId             Vulnerability ID

  --json                          Return results in JSON format

DESCRIPTION
  This command outputs the detailed text of one or more desired rules. Alternatively, it can give you all the rules of 
  one or more benchmarks which can be filtered by severity.

  While you can supply mutliple rule and STIG IDs together, and you can supply multiple benchmark IDs and titles 
  together, you cannot query individual rule IDs AND benchmark IDs at the same time.

EXAMPLES
  $ stig read -v V-2236
  $ stig read -r SV-32632r4_rule
  $ stig read -r SV-32632r4_rule -v V-63323
  $ stig read -b "Windows 10"
  $ stig read -b "Windows 10" -b 2
```

_See code: [src/commands/read.js](https://github.com/defionscode/stig-cli/blob/v0.1.0-0/src/commands/read.js)_

## `stig update [CHANNEL]`

update the stig CLI

```
USAGE
  $ stig update [CHANNEL]
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v1.3.6/src/commands/update.ts)_
<!-- commandsstop -->

# Uninstallation
If you want to uninstall this there is not yet a built in uninstaller but the following should accomplish what you want. You should do this even if you install via `npm`.

**On MacOS**

```
rm -rf ~/Library/Caches/stig
rm -rf ~/.local/share/stig
rm -rf ~/.data/stig
sudo rm `which stig`
```

**On Linux**

```
rm -rf ~/.cache/stig
rm -rf ~/.data/stig
sudo rm `which stig`
```

**On Windows TBD pending testing**

[macostar]: https://s3.amazonaws.com/stigcli/stig-darwin-x64.tar.gz
[macospkg]: https://s3.amazonaws.com/stigcli/stig.pkg
[linuxarm]: https://s3.amazonaws.com/stigcli/stig-linux-arm.tar.gz
[linux64]: https://s3.amazonaws.com/stigcli/stig-linux-x64.tar.gz
[win86tar]: https://s3.amazonaws.com/stigcli/stig-win32-x86.tar.gz
[win64tar]: https://s3.amazonaws.com/stigcli/stig-win32-x64.tar.gz
[win86exe]: https://s3.amazonaws.com/stigcli/stig-x86.exe
[win64exe]: https://s3.amazonaws.com/stigcli/stig-x64.exe
[vanilla]: https://s3.amazonaws.com/stigcli/stig.tar.gz
