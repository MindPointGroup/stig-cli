const { join } = require('path')
const debug = require('debug')('utils:read')
const chalk = require('chalk')
const assert = require('assert')
const { stdout } = require('process')
const wrap = require('wordwrap')(stdout.columns)

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
        fixText,
        desc,
        checkContent,
        severity,
        title
      } = result
      assert(['high', 'medium', 'low'].includes(severity))
      let bTitle = benchmarkTitle
      output += `
${bWhite(wrap(title))}

${bWhite('SEVERITY:')} ${eval(severity)(severity.toUpperCase())} 
${bWhite('VULN ID:')} ${ids(vulnId)}
${bWhite('RULE ID:')} ${ids(ruleId)}

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

