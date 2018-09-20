const { Command } = require('@oclif/command')
const { cli } = require('cli-ux')
const updateSources = require('../utils/update-sources')
class UpdateSourcesCommand extends Command {
  async run () {
    cli.action.start('Updating STIG sources')
    const cacheDir = this.config.cacheDir

    const { err } = await updateSources({ cacheDir })
    if (err) {
      throw err
    }

    cli.action.stop('done!')
  }
}

UpdateSourcesCommand.hidden = true

UpdateSourcesCommand.description = `Updates Benchmark Sourcing Data
Updates a benchmark's source data directly from the DISA STIG web portal. This does several things:
- downloads every public STIG zip archive
- extracts every XML file and places it into the data directory of this library

You probably don't need or want to run this unless you are submitting an update PR to the repository of this CLI itself.
`

module.exports = UpdateSourcesCommand
