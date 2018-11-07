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
stig/0.1.0-0 darwin-x64 node-v8.11.3
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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.2/src/commands/help.ts)_

## `stig update [CHANNEL]`

update the stig CLI

```
USAGE
  $ stig update [CHANNEL]
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v1.3.2/src/commands/update.ts)_
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
