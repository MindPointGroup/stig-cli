const { test } = require('tape')
const {
  getDataPaths,
  getRuleData,
  getXmlData,
  getBenchmarkData
} = require('../src/utils')
const moment = require('moment')

test('Get necessary data from xml xccdf files', async t => {
  let benchmarkFiles
  const xmlDataArr = []
  let allRules = []

  t.test('Able to get all xml file paths', async t => {
    const { err, files } = await getDataPaths()
    t.ok(!err, 'no error in calling getDataPaths()')
    t.ok(files, 'files returned a value')
    t.ok(Array.isArray(files), 'files returned and array')
    t.ok(files.length > 200, 'more than 200 benchmarks found')
    benchmarkFiles = files
    t.end()
  })

  t.test('XML Parser can get proper data', async t => {
    for await (const file of benchmarkFiles) {
      const { err, benchmark } = await getXmlData({ file })
      if (err) {
        t.fail(err.message)
        t.end()
      }
      t.ok(!err, 'no error in getXmlData')
      t.ok(benchmark, 'benchmark data returned from getXmlData()')
      xmlDataArr.push(benchmark)
    }
    t.end()
  })

  t.test('Benchmark data is retrievable', async t => {
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
        t.fail(err.message)
        break
      }
      t.ok(!err, 'no errors in getBenchmarkData')
      t.ok(title, `got title ${title}`)
      t.ok(description || description === undefined, 'got description')
      t.ok(!isNaN(release), `got release ${release}`)
      t.ok(!isNaN(version), `got version ${version}`)
      t.ok(moment(date).isValid(), `got date ${date}`)
      t.ok(Array.isArray(rules), `got array of ${rules.length} rules`)
      allRules = allRules.concat(rules)
    }
      t.end()
  })

  t.test('rules can be parsed', async t => {
    for await (const rule of allRules) {
      const output = await getRuleData(rule)
      const {
        err,
        stigId,
        ruleId,
        severity,
        title,
        description,
        fixText,
        checkText
      } = output

      if (err) {
        t.fail(err, err.message)
        break
      }

      t.ok(stigId, `Got STIG Id ${stigId}`)
      t.ok(ruleId, `Got Rule Id ${ruleId}`)
      t.ok(severity, `Got Severity ${severity}`)
      t.ok(title, `Got title ${title}`)
      t.ok(typeof description === 'string', 'Got Description')
      t.ok(typeof fixText === 'string', 'Got fix text')
      t.ok(typeof checkText === 'string', 'Got check text')
    }
    t.end()
  })

})
