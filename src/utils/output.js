const debug = require('debug')('output')
const chalk = require('chalk')
const { table } = require('table')
const moment = require('moment')
const red = (s) => chalk.red(s)
const { getBenchmark } = require('./query')

const defaultTableConfig = {
  columns: { // this is to wrap titles which can be long
    1: { wrapWord: true, width: 55 }
  },
  border: { // remove borders to make it easier to shell script with
    topBody: ``,
    topJoin: ``,
    topLeft: ``,
    topRight: ``,
    bottomBody: ``,
    bottomJoin: ``,
    bottomLeft: ``,
    bottomRight: ``,
    bodyLeft: ``,
    bodyRight: ``,
    bodyJoin: ``,
    joinBody: ``,
    joinLeft: ``,
    joinRight: ``,
    joinJoin: ``
  }
}

const summaryExtractors = {
  benchmark: b => {
    const {
      $loki,
      title,
      release,
      version,
      date
      // description
      //
      // leaving out description since it's
      // a bit verbose. Easy to add later
      // if folks really want it
    } = b
    const prettyDate = moment(date).format('ll')
    return [$loki, title, release, version, prettyDate]
  },
  rule: r => {
    const {
      severity,
      title,
      stigId,
      ruleId
      // description
      //
      // leaving out description since it's
      // a bit verbose. Easy to add later
      // if folks really want it
    } = r
    return [severity, title, stigId, ruleId]
  }
}

const tableOut = async ({ data, type }) => {
  try {
    const tableStart = {
      benchmark: [[
        red('ID'),
        red('Title'),
        red('Ver.'),
        red('Rel.'),
        red('Date')
      ]],
      rule: [[
        red('STIG ID'),
        red('Rule ID'),
        red('Title'),
        red('Severity')
      ]]
    }
    const tableInit = tableStart[type]
    debug(type)
    const tableData = data.map(summaryExtractors[type])
    const final = tableInit.concat(tableData)

    return table(final, defaultTableConfig)
  } catch (err) {
    debug('error in tableOut()')
    return { err }
  }
}

const jsonOut = data => JSON.stringify({ data })

const output = async ({ data, type, json }) => {
  if (json) {
    return jsonOut(data)
  }
  return tableOut({ data, type })
}

module.exports = {
  output
}
