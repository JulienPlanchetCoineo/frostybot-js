// Telegram Bot Module

const frostybot_module = require('./mod.base')

module.exports = class frostybot_telegram_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Set Telegram Bot Token Key

    async settoken(params) {
        console.log(params)
    }

}