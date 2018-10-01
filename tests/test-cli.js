const test = require('tape')
const { rejects } = require('assert')
const initCmd = require('../src/commands/init')
const lsCmd = require('../src/commands/ls')
const readCmd = require('../src/commands/read')

test('initCmd works', async t => {
  t.test('works when ran properly', async t => {
    await initCmd.run([])
      .catch((err) => {
        console.log(err)
        t.fail(err)
      })
      .then(() => {
        t.ok(true, 'ran successfully')
        t.end()
      })
  })
  t.end()
})

test('ls command', async t => {
  t.comment('ls no args')
  await lsCmd.run([])
    .catch((err) => {
      return t.fail(err)
    })
    .then(() => {
      t.ok(true, 'ran successfully')
    })

  t.comment('ls with args')
  await lsCmd.run(['1'])
    .catch((err) => {
      return t.fail(err)
    })
    .then(() => {
      t.ok(true, 'ran successfully')
    })
  t.end()
})

test('read command', async t => {
  t.comment('read benchmark')
  await readCmd.run(['-b', '1'])
    .catch((err) => {
      return t.fail(err)
    })
    .then(() => {
      t.ok(true, 'ran successfully')
    })
  t.comment('read ruleId')
  await readCmd.run(['-r', 'SV-82449r1_rule'])
    .catch((err) => {
      return t.fail(err)
    })
    .then(() => {
      t.ok(true, 'ran successfully')
    })
  t.comment('read vulnId')
  await readCmd.run(['-v', 'V-3428'])
    .catch((err) => {
      return t.fail(err)
    })
    .then(() => {
      t.ok(true, 'ran successfully')
    })
  t.end()
})
