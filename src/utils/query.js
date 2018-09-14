const { getDb } = require('./db')
const debug = require('debug')('query')

const getBenchmarks = async (dataDir) => {
  try {
    const { err: errDb, stigsDb } = await getDb(dataDir)
    if (errDb) {
      throw errDb
    }

    if (!stigsDb) {
      throw new Error('Database not found, you must call init via the CLI or API before querying. See `stig init --help` for more details')
    }
    return { data: stigsDb.find({}) }
  } catch (err) {
    debug('error in getDb in query')
    return { err }
  }
}

const getBenchmark = async ({ dataDir, title, index }) => {
  try {
    debug('benchmark index', index)
    if (title && index !== undefined) {
      throw new Error('title and index supplied to getBenchmark(), only one is allowed')
    } else if (!title && index === undefined) {
      throw new Error('either title or index must be supplied when calling getBenchmark')
    }

    const { err: errDb, stigsDb } = await getDb(dataDir)
    if (errDb) {
      throw errDb
    }
    if (!stigsDb) {
      throw new Error('Database not found, you must call init via the CLI or API before querying. See `stig init --help` for more details')
    }

    if (title) {
      return { data: stigsDb.findOne({ title }) }
    } else {
      return { data: stigsDb.findOne({ '$loki': index }) }
    }
  } catch (err) {
    debug('error in getBenchmark in query')
    debug(err.message)
    return { err }
  }
}

const getRules = async ({ dataDir, benchmarkTitle, benchmarkIndex, severities }) => {
  debug('benchmarkIndex', benchmarkIndex)
  try {
    if (benchmarkTitle && benchmarkIndex) {
      throw new Error('benchmarkTitle and benchmarkIndex supplied to getRules(), only one is allowed')
    } else if (!benchmarkTitle && !benchmarkIndex) {
      throw new Error('either benchmarkTitle or benchmarkIndex is required when calling getRules. Just in case, 0 is not a valid index number.')
    }

    const { err: errDb, rulesDb } = await getDb(dataDir)
    if (!rulesDb) {
      throw new Error('Database not found, you must call init via the CLI or API before querying. See `stig init --help` for more details')
    }

    if (errDb) {
      throw errDb
    }

    const params = { dataDir }
    benchmarkTitle
      ? params.title = benchmarkTitle
      : params.index = benchmarkIndex

    debug('params', params)
    const { data } = await getBenchmark(params)
    if (!data) {
      throw new Error(`No benchmark found at index ${benchmarkIndex}`)
    }

    const { $loki } = data
    const rParams = {
      stigIndex: $loki
    }

    if (severities) rParams.severity = { '$in': severities }

    return { data: rulesDb.find(rParams) }
  } catch (err) {
    debug('error in getRules in query')
    debug(err.message)
    return { err }
  }
}

const getRule = async ({ dataDir, stigId, ruleId, stigIndex }) => {
  try {
    if (stigId && ruleId) {
      throw new Error('ruleId and stigId supplied to getRule(), only one is allowed')
    } else if (!ruleId && !stigId) {
      throw new Error('either stigId or ruleId is required when calling getRule()')
    }

    const { err: errDb, rulesDb } = await getDb(dataDir)
    if (!rulesDb) {
      throw new Error('Database not found, you must call init via the CLI or API before querying. See `stig init --help` for more details')
    }
    if (errDb) {
      throw errDb
    }
    const query = {}
    if (stigId) query.stigId = stigId
    if (ruleId) query.ruleId = ruleId
    if (stigIndex) query.stigIndex = stigIndex
    debug('query', query)
    const data = rulesDb.findOne(query)
    return { data }
  } catch (err) {
    debug('error in getRule in query')
    debug(err.message)
    return { err }
  }
}

module.exports = {
  getBenchmarks,
  getBenchmark,
  getRules,
  getRule
}
