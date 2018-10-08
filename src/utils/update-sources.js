const fetch = require('node-fetch')
const { join, basename } = require('path')
const loki = require('lokijs')
const { mkDirByPathSync } = require('./')
const unzipper = require('unzipper')
const {
  unlinkSync,
  existsSync,
  createWriteStream,
  createReadStream
} = require('fs')
const cheerio = require('cheerio')
const debug = require('debug')('utils:update-sources')

const URLS = [
  'https://iase.disa.mil/stigs/Pages/a-z.aspx',
  'https://iase.disa.mil/stigs/Pages/a-z.aspx?Paged=TRUE&p_Title=MySQL%20STIG&p_ID=879&PageFirstRow=301&&View={25A09AF8-178B-447B-B42B-8839EBD71CAD}'
]


const getLatestMeta = async cacheDir => {
  const links = []
  try {
    for await (const url of URLS) {
      const { err, data: $ } = await getHTML(url)
      if (err) {
        throw err
      }

      const rows = $('a', '.ms-rtestate-field')

      rows.each((i, el) => {
        const link = $(el).attr('href')
        const isStigZip = /^.*iasecontent.*stigs.*STIG.zip$/.test(link)

        if (isStigZip) {
          const xmlFile = basename(link).replace('.zip', '.xml')
          const zipFile = basename(link)
          links.push({
            xmlPath: join(__dirname, '../../', 'data/benchmarks', xmlFile),
            zipCache: join(cacheDir, 'zip_archives', zipFile),
            url: link
          })
        }
      })
    }

    return { links }
  } catch (err) {
    return { err }
  }
}

const writeSources = async ({ cacheDir, links }) => {
  return new Promise((resolve, reject) => {
    try {
      debug('writeSources start()')
      if (links.length < 200) {
        return { err: new Error('HTML parse issue, less than 200 benchmarks scraped') }
      }
      const dbPath = join(cacheDir, 'stig-sources.db') 
      debug(dbPath)
      const sourcesDB = new loki(dbPath) 
      const sources = sourcesDB.addCollection('sources', { disableMeta: true })
      sources.insert(links)
      debug('writeSources end()')
      sourcesDB.saveDatabase(async () => resolve({ sources }))
    } catch (err) {
      resolve({ err })
    }
  })
}

const downloadSources = async ({ cacheDir, sourcesArr }) => {
  try {
    debug('download start')
    for await (const source of sourcesArr) {
      await download({ cacheDir, url: source.url })
    }
    debug('download end')
    return {}
  } catch (err) {
    return { err }
  }
}

const unzip = async ({ source, cacheDir }) => {
  const {
    zipCache: archivePath,
    xmlPath: desiredFile
  } = source
  const { err, data } = await extract({ archivePath, desiredFile })
  if (err) {
    debug(err)
    throw err
  }
  return { data }
}

const extractSources = async ({ cacheDir, sourcesArr }) => {
  try {
    debug('extractSources start')
    for await (const source of sourcesArr) {
      await unzip({ source, cacheDir })
    }
    debug('extractSources end')
    return {}
  } catch (err) {
    return { err }
  }
}


const getHTML = async url => {
  try {
    debug('getHTML()')
    debug(url)
    const res = await fetch(url)
    const html = await res.text()
    return { data: cheerio.load(html) }
  } catch (err) {
    return { err }
  }
}

const download = async ({ cacheDir, url }) => {
  try {
    const fileName = url.substring(url.lastIndexOf('/') + 1)
    const archiveDir = join(cacheDir, 'zip_archives')
    const archivePath = join(archiveDir, fileName)

    if (!existsSync(archiveDir)) mkDirByPathSync(archiveDir)

    if (!existsSync(archivePath)) {
      await fetch(url)
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
                resolve()
              })
          })
            .then(() => {
              clearTimeout(timer)
            }, (err) => {
              clearTimeout(timer)
              return Promise.reject(err)
            })
        })
    }
  } catch (err) {
    return { err }
  }
}

const extract = ({ archivePath, desiredFile }) => {
  return new Promise((resolve, reject) => {
    try {
      if (!archivePath.includes('U_Apple_OS_X_10-8')) {
        createReadStream(archivePath)
          .pipe(unzipper.ParseOne(/.*Manual-xccdf.xml/i))
          .on('error', err => {
            debug(err)
            debug('ERROR')
            debug(`No xccdf found in ${archivePath}`)
            unlinkSync(desiredFile)
            reject(err)
          })
          .pipe(createWriteStream(desiredFile))
          .on('finish', () => {
            resolve({ data: 'complete' })
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
            reject(err)
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
              .pipe(createWriteStream(desiredFile))
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

module.exports = updateSources = async ({ cacheDir }) => {
  try {
    const { err: linksErr, links } = await getLatestMeta(cacheDir)
    const { err: writeErr, sources } = await writeSources({ cacheDir, links })
    if (writeErr) {
      throw writeErr
    }

    const sourcesArr = sources.find({})

    const { err: dlErr } = await downloadSources({ cacheDir, sourcesArr })
    if (dlErr) {
      throw dlErr
    }

    const { err: extErr } = await extractSources({ cacheDir, sourcesArr })
    if (extErr) {
      debug(extErr)
      throw extErr
    }
    return {}
  } catch (err) {
    return { err }
  }
}
