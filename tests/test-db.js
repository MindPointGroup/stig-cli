const { test } = require('tape')
const { initDb, getDb } = require('../src/utils/db')

test('Database', async t => {
  t.test('init works without error', async t => {
    const { err, stigsDb, rulesDb } = await initDb('/tmp/')
    if (err) {
      t.fail(err, err.message)
    }
    t.ok(!err, 'initDb didnt error out')
    t.ok(rulesDb.count() > 1400, 'rules in db')
    t.ok(stigsDb.count() > 200, 'stigs in db')
    t.end()
  })

  t.test('loading db works', async t => {
    const { err, stigsDb, rulesDb } = await getDb('/tmp/')
    if (err) {
      t.fail(err, err.message)
    }
    t.ok(!err, 'no error in getDb')
    t.ok(rulesDb, `rulesdb found, ${rulesDb.count()}`)
    t.ok(stigsDb, `stigsdb found ${stigsDb.count()}`)
    t.end()
  })
  t.end()
})
