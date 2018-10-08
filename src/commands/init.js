const { Command } = require('@oclif/command')
const { initDb } = require('../utils/db')
const { cli } = require('cli-ux')
const { mkDirByPathSync } = require('../utils')
const debug = require('debug')('command:init')
const { existsSync } = require('fs')

const ensureDataDir = dir => existsSync(dir) ? '' : mkDirByPathSync(dir)

class InitCommand extends Command {
  async run () {
    debug('start init')
    this.parse(InitCommand)
    ensureDataDir(this.config.dataDir)
    cli.action.start('Initializing STIG Database, this can take up to a few minutes')
    const { err } = await initDb(this.config.dataDir)
    if (err) {
      debug('error calling initDb')
      this.error(err.message)
      this.exit(1)
    }
    cli.action.stop()
    debug('end init')
  }
}

InitCommand.description = `Initialize the embedded STIG database
This initializes the embedded database will all the STIG data. You MUST run this command in order first before using the rest of the CLI.

Rerunning this multiple times will delete the current db from disk and recreate it.

The reason stig cli does not ship with the DB preconfigured is to allow for easier auditing of bundled XCCDF files. You can be certain that the database is based entirely off the XML and hasn't been manipulated in any way other than for some slight formatting changes
`

module.exports = InitCommand
