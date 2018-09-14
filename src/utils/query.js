const { getDb } = require('./db')
const debug = require('debug')('query')

const getBenchmarks = async (dataDir) => {
  try {
    const { err: errDb, stigsDb } = await getDb(dataDir)
    if (errDb) {
      throw errDb
    }
    return { data: stigsDb.find({}) }
  } catch (err) {
    debug('error in getDb in query')
    return { err }
  }
}

const getBenchmark = async ({ dataDir, title, index }) => {
  try {
    if (title && index) {
      throw new Error('title and index supplied to getBenchmark(), only one is allowed')
    } else if (!title && !index) {
      throw new Error('either title or index must be supplied when calling getBenchmark')
    }

    const { err: errDb, stigsDb } = await getDb(dataDir)
    if (errDb) {
      throw errDb
    }

    if (title) {
      return { data: stigsDb.findOne({ title }) }
    } else {
      return { data: stigsDb.findOne({ '$loki': index }) }
    }
  } catch (err) {
    debug('error in getBenchmark in query')
    return { err }
  }
}

const getRules = async ({ dataDir, benchmarkTitle, benchmarkIndex, severity }) => {
  try {
    if (benchmarkTitle && benchmarkIndex) {
      throw new Error('benchmarkTitle and benchmarkIndex supplied to getRules(), only one is allowed')
    } else if (!benchmarkTitle && !benchmarkIndex) {
      throw new Error('either benchmarkTitle or benchmarkIndex is required when calling getRules')
    }

    const { err: errDb, rulesDb } = await getDb(dataDir)
    if (errDb) {
      throw errDb
    }

    const params = { dataDir }
    benchmarkTitle
      ? params.title = benchmarkTitle
      : params.index = benchmarkIndex

    debug('params', params)
    const { data } = await getBenchmark(params)
    const { $loki } = data
    const rParams = {
      stigIndex: $loki
    }
    if (severity) rParams.severity = severity

    return { data: rulesDb.find(rParams) }
  } catch (err) {
    debug('error in getBenchmark in query')
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
    debug('error in getBenchmark in query')
    return { err }
  }
}

module.exports = {
  getBenchmarks,
  getBenchmark,
  getRules,
  getRule
}
