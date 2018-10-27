const debug = require('debug')('output')
const chalk = require('chalk')
const { table } = require('table')
const moment = require('moment')
const { stdout } = require('process')
const { getBenchmark } = require('./query')

const red = (s) => chalk.red(s)
const boldWhite = (s) => chalk.whiteBright.bold(s)
const greyDivider = () => chalk.gray(divider('-'))

const divider = char => {
  let hr = ''
  const width = stdout.columns
  debug(`Width of ${width}`)
  for (let i = 0; i < width; i++) {
    hr += char || '#'
  }
  return hr
}
const readOut = async ({ dataDir, data, json }) => {
  let output = json ? [] : [`${greyDivider()}\n`]
  let usedIndexes = []
  let currentBtitle
  for await (const rule of data) {
    const {
      stigId,
      ruleId,
      severity,
      title,
      description,
      fixText,
      version,
      checkText,
      stigIndex
    } = rule
    if (!usedIndexes.includes(stigIndex)) {
      usedIndexes.push(stigIndex)
      const { data: benchmarkObj } = await getBenchmark({ dataDir, index: stigIndex })
      const { title: benchmarkTitle } = benchmarkObj
      currentBtitle = benchmarkTitle
    }
    if (!json) {
      output.push(`${boldWhite('Benchmark')}: ${currentBtitle}`)
      output.push(`${boldWhite('Rule')}: ${title}`)
      output.push(`${boldWhite('STIG ID')}: ${stigId}`)
      output.push(`${boldWhite('Rule ID')}: ${ruleId}`)
      output.push(`${boldWhite('Version')}: ${version}`)
      output.push(`${boldWhite('Severity')}: ${severity}`)
      output.push(`\n${boldWhite('Description')}:\n${description}`)
      output.push(`\n${boldWhite('Check Text')}:\n${checkText}`)
      output.push(`\n${boldWhite('Fix Text')}:\n${fixText}`)
      output.push(`\n${greyDivider()}\n`)
    } else {
      output.push({
        benchmarkTitle: currentBtitle,
        severity,
        title,
        stigId,
        ruleId,
        description,
        checkText,
        fixText
      })
    }
  }
  return json ? JSON.stringify({ data: output }) : output.join('\n')
}

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
      version,
      release,
      date
      // description
      //
      // leaving out description since it's
      // a bit verbose. Easy to add later
      // if folks really want it
    } = b
    const prettyDate = moment(date).format('ll')
    return [$loki, title, version, release, prettyDate]
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
        red('Rel.'),
        red('Ver.'),
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
  output,
  readOut
}
