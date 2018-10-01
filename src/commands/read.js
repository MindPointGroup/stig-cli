const { Command, flags } = require('@oclif/command')
const { json } = require('../flags/format-output')
const { getRule, getRules } = require('../utils/query')
const { readOut, output } = require('../utils/output')

class ReadCommand extends Command {
  async run () {
    const dataDir = this.config.dataDir
    const { flags, args } = this.parse(ReadCommand)
    if (!flags.vulnId && !flags.ruleId && !flags.benchmarkId) {
      this.error('Missing required arguments, see `stig read --help`')
      this.exit(1)
    }
    const { json, cats } = flags
    let severities = cats
    if (cats === 'all') {
      severities = ['high', 'medium', 'low']
    }
    let finalOut = []
    const vulnIds = flags.vulnId
    const ruleIds = flags.ruleId

    const benchmarks = flags.benchmarkId
    if (!benchmarks) {
      if (vulnIds) {
        for await (const stigId of vulnIds) {
          const { data } = await getRule({ stigId, dataDir })
          finalOut.push(data)
        }
      }
      if (ruleIds) {
        for await (const ruleId of ruleIds) {
          const { data } = await getRule({ ruleId, dataDir })
          finalOut.push(data)
        }
      }
    } else {
      let rules
      for await (const benchmark of benchmarks) {
        if (isNaN(benchmark)) {
          const benchmarkTitle = benchmark
          const { data } = await getRules({ dataDir, benchmarkTitle, severities })
          finalOut = finalOut.concat(data)
        } else {
          const benchmarkIndex = benchmark
          const { data } = await getRules({ dataDir, benchmarkIndex, severities })
          finalOut = finalOut.concat(data)
        }
      }
    }
    console.log(await readOut({ dataDir, data: finalOut, json }))
  }
}

ReadCommand.description = `Read one or more rules
This command outputs the detailed text of one or more desired rules. Alternatively, it can give you all the rules of one or more benchmarks which can be filtered by severity.

While you can supply mutliple rule and STIG IDs together, and you can supply multiple benchmark IDs and titles together, you cannot query individual rule IDs AND benchmark IDs at the same time.
`

ReadCommand.examples = [
  '$ stig read -v V-2236',
  '$ stig read -r SV-32632r4_rule',
  '$ stig read -r SV-32632r4_rule -v V-63323',
  '$ stig read -b "Windows 10"',
  '$ stig read -b "Windows 10" -b 2'
]

ReadCommand.flags = {
  cats: flags.string({
    description: 'Rule categories to show from. If no arg is supplied, everything is listed',
    multiple: true,
    char: 'c',
    options: ['high', 'medium', 'low', 'all'],
    default: 'all'
  }),
  vulnId: flags.string({
    char: 'v',
    description: 'Vulnerability ID',
    multiple: true,
    required: false
  }),
  ruleId: flags.string({
    char: 'r',
    description: 'Rule ID',
    multiple: true,
    required: false
  }),
  benchmarkId: flags.string({
    char: 'b',
    description: 'Benchmark ID',
    multiple: true,
    required: false,
    exclusive: ['r', 'v']
  }),
  json: flags.boolean(json())
}

module.exports = ReadCommand
