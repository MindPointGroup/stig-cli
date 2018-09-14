const { Command, flags } = require('@oclif/command')
const { json } = require('../flags/format-output')
const { join } = require('path')
const { output } = require('../utils/output')
const {
  getBenchmarks,
  getRules,
} = require('../utils/query')
const debug = require('debug')('command:ls')


class LsCommand extends Command {
  async run () {
    const dataDir = this.config.dataDir
    const { flags, args } = this.parse(LsCommand)
    const { benchmarkId } = args
    const type = benchmarkId ? 'rule' : 'benchmark'
    const { cats, json } = flags
    let severities = cats
    if (cats === 'all') {
      severities = ['high', 'medium', 'low']
    }
    let data
    let res
    if (type === 'benchmark') {
      res = await getBenchmarks(dataDir)
      if (res.err) {
        this.error(res.err.message)
        this.exit(1)
      }
      data = res.data
    } else {
      const params = { dataDir, severities }
      isNaN(benchmarkId)
        ? params.benchmarkTitle = benchmarkId
        : params.benchmarkIndex = Number(benchmarkId)

      res = await getRules(params)
      if (res.err) {
        this.error(res.err.message)
        this.exit(1)
      }
      data = res.data
    }

    console.log(
      await output({ data, type, json })
    )
    debug(flags, args)
  }
}

LsCommand.description = `List STIG Information
The 'ls' command is the entry point into reading STIG information.
When supplied without arguments it returns a list of all available benchmarks.

Example output

$ stig ls
╔═════╤═════════════════════════════════════════════════════════╤══════╤══════╤════════════╗
║ ID  │ Title                                                   │ Ver. │ Rel. │ Date       ║
╟─────┼─────────────────────────────────────────────────────────┼──────┼──────┼────────────╢
║ 0   │ A10 Networks Application Delivery Controller (ADC) ALG  │ 1    │ 1    │ 4/27/2016  ║
╟─────┼─────────────────────────────────────────────────────────┼──────┼──────┼────────────╢
║ 1   │ A10 Networks Application Delivery Controller (ADC) NDM  │ 1    │ 1    │ 4/27/2016  ║
╟─────┼─────────────────────────────────────────────────────────┼──────┼──────┼────────────╢

And then if you want to list the rules inside of benchmarks supply an ID number

Example output
$ stig ls 0
╔════╤═══════════════════════════════════════════════╤═════════╤═════════════════╤══════════╗
║ ID │ Title                                         │ Vuln ID │ Rule ID         │ Severity ║
╟────┼───────────────────────────────────────────────┼─────────┼─────────────────┼──────────╢
║ 0  │ The A10 Networks ADC, when used for TLS       │ V-67957 │ SV-82447r1_rule │ medium   ║
║    │ encryption anddecryption, must be configured  │         │                 │          ║
║    │ to comply with the required TLSsettings in    │         │                 │          ║
║    │ NIST SP 800-52.                               │         │                 │          ║
╟────┼───────────────────────────────────────────────┼─────────┼─────────────────┼──────────╢
║ 1  │ The A10 Networks ADC, when used to load       │ V-67959 │ SV-82449r1_rule │ low      ║
║    │ balance webapplications, must enable external │         │                 │
`

LsCommand.examples = [
  'stig ls',
  'stig ls 200'

]

LsCommand.args = [
  {
    name: 'benchmarkId',
    required: false,
    description: 'OPTIONAL: List rules for a specific STIG Benchmark'
  }
]

LsCommand.flags = {
  cats: flags.string({
    description: 'Rule categories to show from. If no arg is supplied, everything is listed',
    multiple: true,
    char: 'c',
    options: ['high', 'medium', 'low', 'all'],
    default: 'all'
  }),
  json: flags.boolean(json())
}

module.exports = LsCommand
