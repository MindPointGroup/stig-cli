const {
  readFile,
  readdir
} = require('fs')
const { promisify } = require('util')
const { join } = require('path')
const debug = require('debug')('utils:index')
const { tidy } = require('htmltidy')
const parser = require('fast-xml-parser')
const moment = require('moment')
const { decode } = require('he')

const decodeToObj = async str => {
  const decodedStr = decode(str)
  const { data } = await parseXmlStr(decodedStr)
  return { data }
}

const getRuleData = async rule => {
  let VulnDiscussion
  try {
    const {
      '@_id': stigId,
      Rule
    } = rule

    const {
      '@_id': ruleId,
      '@_severity': severity,
      title,
      description,
      version,
      fixtext,
      check
    } = Array.isArray(Rule) ? Rule[0] : Rule // sometimes it's an array but not usually

    // not every rule has fix and check content
    const fixText = fixtext && fixtext['#text']
    const checkText = check && check['check-content']
    const { data } = await decodeToObj(description)
    VulnDiscussion = data.VulnDiscussion

    if (VulnDiscussion.DIAGNOSTIC_DEST) { // more snowflakes
      VulnDiscussion = VulnDiscussion.DIAGNOSTIC_DEST
    } else if (VulnDiscussion['#text']) { // one of these is not like the others ¯\_(ツ)_/¯
      if (VulnDiscussion['Subject']) {
        VulnDiscussion = `${VulnDiscussion['#text']}${VulnDiscussion['Subject']}`
      } else {
        VulnDiscussion = `${VulnDiscussion['#text']}`
      }
    }
    return {
      stigId,
      ruleId,
      severity,
      version,
      title: title.replace(/(\r\n|\n|\r)/gm, ' '),
      description: VulnDiscussion && VulnDiscussion.replace(/(\r\n|\n|\r)/gm, ' '),
      fixText: fixText ? fixText.replace(/(\r\n|\n|\r)/gm, ' ') : '',
      checkText: checkText ? checkText.replace(/(\r\n|\n|\r)/gm, ' ') : ''
    }
  } catch (err) {
    debug('error in getRuleData')
    return { err }
  }
}

const getBenchmarkData = async xml => {
  debug('start getBenchmarkData()')
  try {
    const {
      title,
      description,
      version
    } = xml
    const date = xml.status['@_date']
    const rawRel = xml['plain-text']['#text'].replace(/(\r\n|\n|\r)/gm, ' ')
    const regex = /^\D+(\d+).+$/
    const match = regex.exec(rawRel)
    const release = match[1]
    const rules = xml.Group
    if (!description) debug(`${title} has no description`)
    debug('end getBenchmarkData()')
    return {
      title: title.replace(/(\r\n|\n|\r)/gm, ' '),
      description: description && description.replace(/(\r\n|\n|\r)/gm, ' '),
      release: Number(release),
      version: Number(version),
      date: moment(date).toISOString(),
      rules
    }
  } catch (err) {
    debug(`error in getBenchmarkData()`)
    debug(xml)
    return { err }
  }
}

const getDataPaths = async () => {
  try {
    const rDir = promisify(readdir)
    const filesData = await rDir(join(__dirname, '../../data/benchmarks'))
    const files = filesData.map(file => join(__dirname, '../../data/benchmarks/', file))
    return { files }
  } catch (err) {
    return { err }
  }
}

const sanitizeXml = async ({ xmlAsString }) => {
  try {
    const pTidy = promisify(tidy)
    const tidyOpts = {
      doctype: 'omit',
      'input-xml': true,
      'output-xml': true
    }
    const xmlData = await pTidy(xmlAsString, tidyOpts)
    return { xmlData }
  } catch (err) {
    return { err }
  }
}

const parseXmlStr = async (xmlData) => {
  const parseOpts = {
    parseAttributeValue: true,
    cdataTagName: '_cdata',
    ignoreAttributes: false
  }
  const data = parser.parse(xmlData, parseOpts)
  if (!data) {
    throw new Error('no data')
  }

  return { data }
}

const getXmlData = async ({ file }) => {
  try {
    const rFile = promisify(readFile)
    const xmlAsString = await rFile(file)
    const { err, xmlData } = await sanitizeXml({ xmlAsString })
    if (err) throw err

    const { data } = await parseXmlStr(xmlData)
    return { benchmark: data.Benchmark }
  } catch (err) {
    debug('error in parsing xml')
    return { err }
  }
}

module.exports = {
  getRuleData,
  getDataPaths,
  getXmlData,
  getBenchmarkData
}
