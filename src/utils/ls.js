const { readFile } = require('fs')
const { join } = require('path')
const { promisify } = require('util')
const debug = require('debug')('utils:ls')
const { tidy } = require('htmltidy')
const parser = require('fast-xml-parser')
const he = require('he')

module.exports.fillTableArr = async ({ data, array }) => {
  try {
    for (const [index, b] of data.entries()) {
      const { title, ver, rel, date } = b
      array.push([index, title, rel, ver, date])
    }
    return { data: array }
  } catch (err) {
    return { err }
  }
}

module.exports.fillRulesArr = async ({ data, array }) => {
  try {
    for (const [index, b] of data.entries()) {
      const { title, vulnId, ruleId, stigId, severity } = b
      array.push([index, title, vulnId, ruleId, stigId, severity])
    }
    return { data: array }
  } catch (err) {
    return { err }
  }
}

module.exports.parseXML = async (xmlString) => {
  try {
    const pTidy = promisify(tidy)
    const xmlData = await pTidy(xmlString, {
      doctype: 'omit',
      'input-xml': true,
      'output-xml': true
    })
    const parseOpts = {
      attributeNamePrefix: '$',
      parseAttributeValue: true,
      ignoreAttributes: false,
      attrValueProcessor: a => he.decode(a, {isAttributeValue: true}),
      tagValueProcessor: a => he.decode(a)
    }
    const data = parser.parse(xmlData, parseOpts)
    if (!data) {
      throw new Error('no data')
    }
    return { data }
  } catch (err) {
    debug('err in xml2js')
    console.log(err)
    return { err }
  }
}

module.exports.listRules = async ({ xmlPath }) => {
  try {
    const rules = []
    const rFile = promisify(readFile)
    const file = await rFile(xmlPath)
    const cData = file.toString()
    const { err: parseErr, data: xmlData } = await module.exports.parseXML(cData)
    if (parseErr || !xmlData) {
      return { parseErr }
    }
    for await (let [index, r] of xmlData.Benchmark.Group.entries()) {
      const rule = Array.isArray(r.Rule) ? r.Rule[0] : r.Rule
      const title = rule.title.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      const { err: descErr, data: descData } = await module.exports.parseXML(rule.description)
      if (descErr){
        debug(descErr)
        throw descErr
      }
      const { VulnDiscussion: desc } = descData
      const benchmarkTitle = xmlData.Benchmark.title
      const checkContent = rule.check && rule.check['check-content']
      const fixText = rule.fixtext['#text']
      const vulnId = r.$id
      const ruleId = rule.$id
      const stigId = rule.version
      const severity = rule.$severity
      rules.push({ index, benchmarkTitle, title, vulnId, ruleId, stigId, severity, fixText, desc, checkContent })
    }
    return { data: rules }
  } catch (err) {
    debug('ERROR listRules')
    debug(err)
    return { err }
  }
}
