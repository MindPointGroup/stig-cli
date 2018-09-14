const {
  readFile,
  unlinkSync,
  existsSync,
  mkdirSync,
  readdir,
  createWriteStream,
  createReadStream
} = require('fs')
const { promisify } = require('util')
const { join } = require('path')
const unzipper = require('unzipper')
const debug = require('debug')('utils:index')
const fetch = require('node-fetch')
const { tidy } = require('htmltidy')
const parser = require('fast-xml-parser')
const moment = require('moment')
const { decode } = require('he')

const decodeToObj = async str => {
  const decodedStr = decode(str)
  const { data } = await parseXmlStr(decodedStr)
  return { data }
}

module.exports.getRuleData = async rule => {
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

module.exports.getBenchmarkData = async xml => {
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

module.exports.getDataPaths = async () => {
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

module.exports.getXmlData = async ({ file }) => {
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

module.exports.download = async ({ url, title, tmpDir }) => {
  try {
    const fileName = url.substring(url.lastIndexOf('/') + 1)
    const archiveDir = join(tmpDir, 'zip_archives')
    const archivePath = join(archiveDir, fileName)

    if (!existsSync(archiveDir)) mkdirSync(archiveDir)

    if (!existsSync(archivePath)) {
      const data = await fetch(url)
        .then((res) => res.ok ? res
          : Promise.reject(new Error(`Initial error downloading file => ${res.error}`))
        )
        .then((res) => {
          if (!res.ok) {
            return Promise.reject(new Error({
              reason: 'Initial error downloading file',
              meta: {url, error: new Error(res.statusText)}
            }))
          }

          const stream = createWriteStream(archivePath)
          let timer

          return new Promise((resolve, reject) => {
            const errorHandler = (error) => {
              debug('errorHandler')
              reject(new Error(error))
            }

            res.body
              .on('error', errorHandler)
              .pipe(stream)

            stream
              .on('open', () => {
                timer = setTimeout(() => {
                  stream.close()
                  debug('dl timeout')
                  reject(new Error(`Timed out downloading file from ${url}`))
                }, 10e5)
              })
              .on('error', errorHandler)
              .on('finish', () => {
                debug(`Finished downloading ${url}`)
                resolve(archivePath)
              })
          }).then((archivePath) => {
            clearTimeout(timer)
            return archivePath
          }, (err) => {
            clearTimeout(timer)
            return Promise.reject(err)
          })
        })
      return { data }
    } else {
      return { data: archivePath }
    }
  } catch (err) {
    return { err }
  }
}

module.exports.extract = ({ archivePath, desiredFile }) => {
  return new Promise((resolve, reject) => {
    try {
      const desiredFileFullPath = join(__dirname, '../../', desiredFile)
      if (!archivePath.includes('U_Apple_OS_X_10-8')) {
        createReadStream(archivePath)
          .pipe(unzipper.ParseOne(/.*Manual-xccdf.xml/i))
          .on('error', err => {
            debug(err)
            debug('ERROR')
            debug(`No xccdf found in ${archivePath}`)
            unlinkSync(desiredFileFullPath)
            return reject(err)
          })
          .pipe(createWriteStream(desiredFileFullPath))
          .on('finish', () => {
            return resolve({ data: 'complete' })
          })
      } else {
        // for some reason Apple Workstation 10.8 STIGs xccdf is zipped up
        // inside a zip. ¯\_(ツ)_/¯
        debug('Working on a zip inside a zip')
        const secondZipPath = archivePath.replace('.zip', '-secondary.zip')
        createReadStream(archivePath)
          .pipe(unzipper.ParseOne(/.*.zip/i)) // nested ZIP archives YAY!
          .on('error', err => {
            debug(err)
            debug('ERROR')
            unlinkSync()
            return reject(err)
          })
          .pipe(createWriteStream(secondZipPath))
          .on('finish', () => {
            createReadStream(secondZipPath)
              .pipe(unzipper.ParseOne(/.*Manual-xccdf.xml/i))
              .on('error', err => {
                debug(err)
                debug('ERROR')
                unlinkSync()
                return reject(err)
              })
              .pipe(createWriteStream(desiredFileFullPath))
              .on('finish', () => {
                return resolve({ data: 'complete' })
              })
          })
      }
    } catch (err) {
      debug(err)
      return reject(err)
    }
  })
}
