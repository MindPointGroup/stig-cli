const { Command, flags } = require('@oclif/command')

class InitCommand extends Command {
  async run () {

  }
}

InitCommand.description = `Initialize the STIG Data`

module.exports = InitCommand
