const { Command, flags } = require('@oclif/command')
const { json } = require('../flags/format-output')
const debug = require('debug')('read')
const { findInAll, findInBenchmark, showResults } = require('../utils/read')

class ReadCommand extends Command {
  async run () {
    const { flags, args } = this.parse(ReadCommand)
    debug(flags, args)
    const { benchmarkId } = args
    const { json, rule } = flags

    if (benchmarkId) {
      const { err: fibErr, data: fibData } = await findInBenchmark({ benchmarkId, rule })
      if (fibErr) {
        throw fibErr
      }
      if (json) {
        console.log(JSON.stringify({ data: fibData }))
        return
      }
      const { err: showErr, output } = await showResults({ results: fibData })
      if (showErr) {
        throw showErr
      }
      console.log(output)
      return
    }
    // no benchmark id, search everything...
    const { err: allErr, data: allData } = await findInAll({ rule })
    if (allErr) {
      throw allErr
    }

    const { err: showErr, output } = await showResults({ results: allData })
    if (showErr) {
      throw showErr
    }
    console.log(output)
  }
}

ReadCommand.description = `Read one or more rules from a specific benchmark.
This command outputs the detailed text of a rule from within a benchmark.

First you need to get the ID of the benchmark you want

Example
$ stig ls

╟─────┼─────────────────────────────────────────────────────────┼──────┼──────┼────────────╢
║ 89  │ Microsoft IIS 7                                         │ 16   │ 1    │ 1/26/2018  ║
╟─────┼─────────────────────────────────────────────────────────┼──────┼──────┼────────────╢

Then you want to get the rule ID 

Example
$ stig ls 89

╟────┼───────────────────────────────────────────────┼─────────┼─────────────────┼─────────────────┼──────────╢
║ 2  │ Installation of compilers on production web   │ V-2236  │ SV-32632r4_rule │ WG080 IIS7      │ medium   ║
║    │ servers isprohibited.                         │         │                 │                 │          ║
╟────┼───────────────────────────────────────────────┼─────────┼─────────────────┼─────────────────┼──────────╢

Then to look at the text for this rule we have a few options

Examples:
$ stig read 89 -r V-2236
$ stig read 89 -r SV-32632r4_rule
$ stig read 89 -r 'WG080 IIS7'
$ stig read 89 -r 2

You can pass in multiple '-r' flags to output multiple rules at once

If you want to output ALL rules just omit the '-r' flag

$ stig read 89
`

ReadCommand.examples = [
  '$ stig read 89 -r V-2236',
  '$ stig read 89 -r SV-32632r4_rule',
  '$ stig read 89 -r \'WG080 IIS7\'',
  '$ stig read 89 -r 2',
  '$ stig read 89'
]

ReadCommand.args = [
  {
    name: 'benchmarkId',
    description: 'The benchmark id of the rule(s) you want to get content for.',
    required: true
  }
]

ReadCommand.flags = {
  rule: flags.string({
    char: 'r',
    description: 'A valid STIG Identifier for the rule. It can be a Vulnerability, Rule, or STIG ID. Multiple rules can be specified',
    multiple: true
  }),
  json: flags.boolean(json())
}

module.exports = ReadCommand
