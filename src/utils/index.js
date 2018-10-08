const {
  mkdirSync,
  readFile,
  readdir
} = require('fs')
const { promisify } = require('util')
const { isAbsolute, join, resolve, sep } = require('path')
const debug = require('debug')('utils:index')
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
    if (!description) debug(`${title} has no description`)
    const date = xml.status['@_date']
    const rawRel = xml['plain-text']['#text'].replace(/(\r\n|\n|\r)/gm, ' ')
    const regex = /^\D+(\d+).+$/
    const match = regex.exec(rawRel)
    const release = match[1]
    const rules = Array.isArray(xml.Group) ? xml.Group : [xml.Group]
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

const parseXmlStr = async xmlData => {
  try {
    const parseOpts = {
      parseAttributeValue: true,
      cdataTagName: '_cdata',
      ignoreAttributes: false
    }
    const data = parser.parse(xmlData.toString(), parseOpts)
    if (!data) {
      throw new Error('no data')
    }
    return { data }
  } catch (err) {
    debug('parseXmlStr() err')
    debug(err)
    return { err }
  }
}

const getXmlData = async ({ file }) => {
  debug('getXmlData()')
  try {
    const rFile = promisify(readFile)
    const xmlAsString = await rFile(file)
    const { data } = await parseXmlStr(xmlAsString)
    return { benchmark: data.Benchmark }
  } catch (err) {
    debug('error in parsing xml')
    debug(err)

    return { err }
  }
}

const  mkDirByPathSync = targetDir => {
  const initDir = isAbsolute(targetDir) ? sep : ''
  const baseDir = __dirname

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = resolve(baseDir, parentDir, childDir)
    try {
      mkdirSync(curDir)
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        debug('mkDirByPathSync() path exists')
        return curDir
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`)
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].includes(err.code)
      if ((!caughtErr || caughtErr) && targetDir === curDir) {
        throw err // Throw if it's just the last created dir.
      }
    }

    return curDir
  }, initDir)
}

module.exports = {
  mkDirByPathSync,
  getRuleData,
  getDataPaths,
  getXmlData,
  getBenchmarkData
}
