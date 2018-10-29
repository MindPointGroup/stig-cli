const debug = require('debug')('utils:db')
const { existsSync, unlinkSync } = require('fs')
const loki = require('lokijs')
const {
  getDataPaths,
  getRuleData,
  getXmlData,
  getBenchmarkData
} = require('./')
const { join } = require('path')
const { decode } = require('he')

const getXmlArr = async files => {
  debug('getXmlArr start')
  const xmlDataArr = []
  for await (const file of files) {
    const { err: errXml, benchmark } = await getXmlData({ file })
    if (errXml) {
      debug('error in initDb with getXmlData')
      return { err: errXml }
    }
    xmlDataArr.push(benchmark)
  }
  debug(`getXmlArr end, data length of ${xmlDataArr.length}`)
  return { xmlDataArr }
}

const getBmArr = async xmlDataArr => {
  debug('start getBmArr')
  const bmDataArr = []
  for await (const data of xmlDataArr) {
    const {
      err,
      title,
      description,
      release,
      version,
      date,
      rules
    } = await getBenchmarkData(data)

    if (err) {
      debug('error in getBenchmarkData')
      return { err }
    }

    bmDataArr.push({
      title: title.replace('STIG', '').replace(/sec.*tech.*impl.*de/gi, '').replace('()', '').trim(),
      description,
      release,
      version,
      date,
      rules
    })
  }
  debug(`end getBmArr, data length of ${bmDataArr.length}`)
  return { bmDataArr }
}

const mkDb = ({ data, dataDir }) => {
  return new Promise(async (resolve, reject) => {
    try {
      debug('start mkDb')
      const dbPath = join(dataDir, 'database.db')
      if (existsSync(dbPath)) {
        unlinkSync(dbPath)
      }
      debug(`Making db at ${dbPath}`)
      const db = new loki(dbPath)
      const stigsDb = db.addCollection('stigs', {
        unique: ['title'],
        disableMeta: true
      })
      const rulesDb = db.addCollection('rules', {
        indices: ['stigId', 'ruleId', 'stigIndex'],
        disableMeta: true
      })
      for await (const benchmark of data) {
        const {
          title,
          description,
          release,
          version,
          date,
          rules
        } = benchmark

        const stigEntry = stigsDb.insert({
          title: `${title} v${version} r${release}`,
          description,
          release,
          version,
          date
        })

        const stigIndex = stigEntry.$loki

        if (Array.isArray(rules)) {
          for await (const rule of rules) {
            const {
              err: errRule,
              stigId,
              ruleId,
              version,
              severity,
              title,
              description,
              fixText,
              checkText
            } = await getRuleData(rule)

            if (errRule) {
              debug('error in getting rule')
              resolve({ err: errRule })
            }

            rulesDb.insert({
              stigId,
              ruleId,
              severity,
              title,
              version,
              description: decode(description),
              fixText: decode(fixText),
              checkText: decode(checkText),
              stigIndex
            })
          }
        } else {
          // 'Citrix XenDesktop v7.x StoreFront'
          // is a snowflake. It's rules attr is
          // not an array.
          const {
            err: errRule,
            stigId,
            ruleId,
            severity,
            title,
            version,
            description,
            fixText,
            checkText
          } = await getRuleData(rules)

          if (errRule) {
            debug('error in getting rule')
            resolve({ err: errRule })
          }

          rulesDb.insert({
            stigId,
            ruleId,
            severity,
            title,
            version,
            description: decode(description),
            fixText: decode(fixText),
            checkText: decode(checkText),
            stigIndex
          })
        }
      }
      db.saveDatabase(async () => {
        debug('end mkDb')
        resolve({ stigsDb, rulesDb })
      })
    } catch (err) {
      resolve({ err })
    }
  })
}

const collectData = async () => {
  debug('collectData Start')
  const { err: errFiles, files } = await getDataPaths()
  if (errFiles) {
    debug('error with getDataPaths')
    return { err: errFiles }
  }
  debug(`getDataPaths returned ${files.length} files`)

  const { err: errXmlArr, xmlDataArr } = await getXmlArr(files)
  if (errXmlArr) {
    debug('error with getXmlArr')
    return { err: errFiles }
  }

  const { err: errBmData, bmDataArr } = await getBmArr(xmlDataArr)
  if (errBmData) {
    debug('error with getBmArr')
    return { err: errBmData }
  }

  debug('collectData end')
  return { bmDataArr }
}

const initDb = async (dataDir) => {
  debug('initDb start')
  const { err: errCollect, bmDataArr } = await collectData()
  if (errCollect) {
    debug('error in collectData')
    return { err: errCollect }
  }

  const { err: errMkDb, stigsDb, rulesDb } = await mkDb({ data: bmDataArr, dataDir })
  if (errMkDb) {
    debug('error in mkDb')
    return { err: errMkDb }
  }
  debug('initDb end')
  return { stigsDb, rulesDb }
}

const getDb = async (dataDir) => {
  return new Promise((resolve, reject) => {
    try {
      const dbPath = join(dataDir, 'database.db')
      const ldb = new loki(dbPath)
      ldb.loadDatabase({}, (res) => {
        const rulesDb = ldb.getCollection('rules')
        const stigsDb = ldb.getCollection('stigs')
        if (!rulesDb || !stigsDb) {
          resolve({ err: new Error('Database not found, you must call init via the CLI or API before querying. See `stig init --help` for more details') })
        }
        resolve({ stigsDb, rulesDb })
      })
    } catch (err) {
      resolve({ err })
    }
  })
}

module.exports = { initDb, getDb }
