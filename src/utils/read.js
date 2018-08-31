const { listRules, fillRulesArr } = require('./ls')
const JsonDB = require('node-json-db')
const { join } = require('path')
const bDB = new JsonDB(join(__dirname, '../../', 'data/benchmarks'), true, true)
const BENCHMARKS = bDB.getData('data/benchmarks')
const debug = require('debug')('utils:read')
const chalk = require('chalk')
const assert = require('assert')
const { stdout } = require('process')
const wrap = require('wordwrap')(stdout.columns)

module.exports.findInAll = async ({ rule }) => {
  // TODO dry it up
  let rules = []
  try {
    for await (const benchmark of BENCHMARKS) {
      let { xmlPath } = benchmark
      xmlPath = join(__dirname, '../../', xmlPath)
      const { err, data } = await listRules({ xmlPath })
      if (err) {
        debug('err in listRules()')
        throw err
      }
      const matches = (ruleObj) => {
        return rule.includes(String(ruleObj.index)) ||
          rule.includes(ruleObj.vulnId) ||
          rule.includes(ruleObj.ruleId) ||
          rule.includes(ruleObj.stigId)
      }
      rules = rules.concat(data.filter(matches))
    }

    if (rules.length === 0) {
      debug('ERROR, no rules found')
      return { err: new Error('no rules found') }
    }

    return { data: rules }
  } catch (err) {
    debug('findAll err')
    return { err }
  }
}

module.exports.findInBenchmark = async ({ benchmarkId, rule }) => {
  try {
    let { xmlPath } = BENCHMARKS[benchmarkId]
    xmlPath = join(__dirname, '../../', xmlPath)
    debug(xmlPath)
    const { err, data } = await listRules({ xmlPath })
    if (err) {
      debug('err in listRules()')
      return { err }
    }

    let rules
    if (rule) {
      const matches = (ruleObj) => {
        return rule.includes(String(ruleObj.index)) ||
          rule.includes(ruleObj.vulnId) ||
          rule.includes(ruleObj.ruleId) ||
          rule.includes(ruleObj.stigId)
      }
      rules = data.filter(matches)
      if (rules.length === 0) {
        debug('ERROR, no rules found')
        return { err: new Error('no rules found') }
      }
    } else {
      rules = data
    }
    return { data: rules }
  } catch (err) {
    debug('error')
    return { err }
  }
}

module.exports.showResults = async ({ results }) => {
  try {
    const mainTitle = (s) => chalk.red.bold(s)
    const bWhite = (s) => chalk.whiteBright.bold(s)
    const ids = (s) => chalk.cyan.bold(s)
    const low = (s) => chalk.bgWhite(chalk.black(s))
    const medium = (s) => chalk.bgYellow(chalk.black(s))
    const high = (s) => chalk.bgRed(s)
    const rDivider = () => chalk.gray(divider('-'))

    let output = `${divider()}\n`
    for (const result of results) {
      const {
        benchmarkTitle,
        vulnId,
        ruleId,
        stigId,
        fixText,
        desc,
        checkContent,
        severity,
        title
      } = result
      assert(['high', 'medium', 'low'].includes(severity))
      bTitle = benchmarkTitle
      output += `
${bWhite(wrap(title))}

${bWhite('SEVERITY:')} ${eval(severity)(severity.toUpperCase())} 
${bWhite('VULN ID:')} ${ids(vulnId)}
${bWhite('RULE ID:')} ${ids(ruleId)}
${bWhite('STIG ID:')} ${ids(stigId)}

${bWhite('DESCRIPTION:')}
${wrap(desc)}

${bWhite('FIX TEXT:')}
${wrap(fixText)}

${bWhite('CHECK:')}
${wrap(checkContent)}

${rDivider()}
    `
    }
    output = `\n${divider()}\n${mainTitle(bTitle)}\n` + output + `\n${divider()}`
    return { output }
  } catch (err) {
    return { err }
  }
}

const divider = (char) => {
  let hr = ''
  const width = stdout.columns
  debug(`Width of ${width}`)
  for (let i = 0; i < width; i++) {
    hr += char || '#'
  }
  return hr
}
