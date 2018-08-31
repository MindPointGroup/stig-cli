const { Command, flags } = require('@oclif/command')
const { cats } = require('../flags/cat')
const { json } = require('../flags/format-output')
const { table } = require('table')
const JsonDB = require('node-json-db')
const { join } = require('path')
const bDB = new JsonDB(join(__dirname, '../../', 'data/benchmarks'), true, true)
const chalk = require('chalk')
const debug = require('debug')('ls')
const { listRules, fillTableArr, fillRulesArr } = require('../utils/ls')
const red = (s) => chalk.red(s)

const lsRules = async ({ data, benchmarkId, cats, json }) => {
  const rulesHeader = [[red('ID'), red('Title'), red('Vuln ID'), red('Rule ID'), red('STIG ID'), red('Severity')]]
  const tConfig = {
    columns: {
      1: { wrapWord: true, width: 45 }
    }
  }
  const xmlPath = join(__dirname, '../../', data[benchmarkId].xmlPath)
  debug(`Parsing ${xmlPath}`)
  let { err: rulesErr, data: rulesData } = await listRules({ xmlPath })
  if (rulesErr) {
    throw rulesErr
  }

  if (cats.length < 3) {
    const sevs = []
    if (cats.includes('1')) sevs.push('high')
    if (cats.includes('2')) sevs.push('medium')
    if (cats.includes('3')) sevs.push('low')
    rulesData = rulesData.filter(r => sevs.includes(r.severity))
  }

  if (json) {
    debug('json flag detected')
    console.log(JSON.stringify({ data: rulesData }))
    return
  }
  const { err: fillErr, data: rulesTData } = await fillRulesArr({ data: rulesData, array: rulesHeader })
  if (fillErr) {
    throw fillErr
  }
  console.log(table(rulesTData, tConfig))
  debug(cats)
}

class LsCommand extends Command {
  async run () {
    let data
    const tConfig = {
      columns: {
        1: { wrapWord: true, width: 55 }
      }
    }
    const { flags, args } = this.parse(LsCommand)
    const { benchmarkId } = args
    const { cats, json } = flags

    data = bDB.getData('data/benchmarks')
    if (benchmarkId) {
      await lsRules({ data, benchmarkId, cats, json })
      return
    }

    if (flags.json) {
      console.log(JSON.stringify({ data }))
      return
    }

    const tData = [[red('ID'), red('Title'), red('Ver.'), red('Rel.'), red('Date')]]

    const { err, data: tableArr } = await fillTableArr({ data, array: tData })
    if (err) {
      throw err
    }
    console.log(table(tableArr, tConfig))
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
╔════╤═══════════════════════════════════════════════╤═════════╤═════════════════╤════════════════╤══════════╗
║ ID │ Title                                         │ Vuln ID │ Rule ID         │ STIG ID        | Severity ║
╟────┼───────────────────────────────────────────────┼─────────┼─────────────────┼────────────────┼──────────╢
║ 0  │ The A10 Networks ADC, when used for TLS       │ V-67957 │ SV-82447r1_rule │ AADC-AG-000018 │ medium   ║
║    │ encryption anddecryption, must be configured  │         │                 │                │          ║
║    │ to comply with the required TLSsettings in    │         │                 │                │          ║
║    │ NIST SP 800-52.                               │         │                 │                │          ║
╟────┼───────────────────────────────────────────────┼─────────┼─────────────────┼────────────────┼──────────╢
║ 1  │ The A10 Networks ADC, when used to load       │ V-67959 │ SV-82449r1_rule │ AADC-AG-000023 │ low      ║
║    │ balance webapplications, must enable external │         │                 │                │          ║
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
  cats: flags.integer(cats()),
  json: flags.boolean(json())
}

module.exports = LsCommand
