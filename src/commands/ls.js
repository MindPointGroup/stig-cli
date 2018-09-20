const { Command, flags } = require('@oclif/command')
const { json } = require('../flags/format-output')
const { output } = require('../utils/output')
const {
  getBenchmarks,
  getRules
} = require('../utils/query')
const debug = require('debug')('command:ls')

class LsCommand extends Command {
  async run () {
    const dataDir = this.config.dataDir
    const { flags, args } = this.parse(LsCommand)
    const { benchmarkId } = args
    const type = benchmarkId ? 'rule' : 'benchmark'
    debug('type', type)
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
      debug('is benchmark id a number', !isNaN(benchmarkId), benchmarkId)
      isNaN(benchmarkId)
        ? params.benchmarkTitle = benchmarkId
        : params.benchmarkIndex = Number(benchmarkId)
      debug('getrules params', params)

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

If you want only certain severities you can pass the --cats/-c flag. By default it returns all the rules. If you do \`-c high -c\` low it will only return low and high.

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

`

LsCommand.examples = [
  'stig ls',
  'stig ls 200',
  'stig ls "Windows 10"',
  'stig ls "Windows 10" -c low -c medium'

]

LsCommand.args = [
  {
    name: 'benchmarkId',
    required: false,
    description: 'OPTIONAL: List rules for a specific STIG Benchmark. Supply the ID or title'
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
