// Telegram Bot Module

const { Telegraf, session, Markup, Stage, BaseScene: Scene } = require('telegraf')
md5 = require('md5');
const frostybot_module = require('./mod.base')

module.exports = class frostybot_telegram_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Initialize 

    async initialize() {
        this.start();
    }


    // Set Telegram Bot Token Key

    async settoken(params) {

        var schema = {
            token: { required: 'string', },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 
        
        var token = this.utils.extract_props(params, ['token'])

        if (this.settings.set('telegram', 'token', token)) {
            this.start()
            return true;
        }
        return false;

    }


    // Get Telegram Bot Token Key

    async gettoken(params) {
        var token = this.settings.get('telegram', 'token')
        if (token != null) {
            return token;
        }
        return false;   
    }


    // Apply command aliases

    alias(text) {
        const aliases = [
            { search: 'account:', replace: 'accounts:'  },
            { search: 'name=',    replace: 'stub=' },
        ];
        for(var i=0; i < aliases.length; i++) {
            var alias = aliases[i];
            var search = alias.search;
            var replace = alias.replace;
            text = text.replace(search, replace)
        }    
        return text
    }

    // Check if received message is an allowed Frostybot Command

    is_command(message) {
        var text = this.alias(message.text)
        const allowed = [
            'accounts:add',
            'accounts:get',
            'accounts:delete',
        ]
        var first = text.split(' ')[0].toLowerCase().trim()
        if (allowed.includes(first)) {
            return true
        }
        return false
    }


    // Exec Command

    async exec_command(message) {
        const core = global.frostybot._modules_.core
        var text = this.alias(message.text)
        var params = core.parse_request(text)
        params.tenant = md5(message.from.id)
        var command = params.command
        var result = await core.execute_single(params)
        if (result.hasOwnProperty('data')) {
            switch (command) {
                case 'accounts:add'        :    if (result.hasOwnProperty('result')) {
                                                    if (['error','success'].includes(result.result)) {
                                                        return result.message
                                                    }
                                                }
                                                break;
                case 'accounts:get'        :    if (result.hasOwnProperty('result')) {
                                                    if (['error'].includes(result.result)) {
                                                        return result.message
                                                    }
                                                }
                                                if (this.utils.is_object(result.data)) {
                                                    if (Object.values(result.data).length == 0)
                                                       return 'You do not currently have any accounts configured.' + "\n" + 'Use <b>accounts:add</b> to add a new account.'
                                                    var accounts = {}
                                                    for (const [key, value] of Object.entries(result.data)) {
                                                        value['stub'] = key
                                                        for (const [paramkey, paramval] of Object.entries(value.parameters)) {
                                                            value[paramkey] = paramval
                                                        }
                                                        delete value.parameters
                                                        delete value.tenant
                                                        delete value.apikey
                                                        delete value.secret
                                                        accounts[key] = value
                                                        
                                                    }
                                                    var str = ''
                                                    //str += '<html><body><table>'
                                                    for (const [stub, account] of Object.entries(accounts)) {
                                                        str += '<b><u>' + stub + '</u></b>' + "\n"
                                                        str += '<pre>' + "\n"
                                                        for (const [paramkey, paramval] of Object.entries(account)) {
                                                            if (paramkey != 'stub') {
                                                                str += ' ' + (paramkey + ':').padEnd(13, ' ') + paramval + "\n"
                                                            }
                                                        }
                                                        str += '</pre>' + "\n"
                                                    }
                                                    //if (Object.values(renamed).length == 1)
                                                    //    return Object.values(renamed)[0]
                                                    return str;
                                                }
                                                break;
                case 'accounts:delete'     :    if (result.hasOwnProperty('result')) {
                                                    if (['error','success'].includes(result.result)) {
                                                        return result.message
                                                    }
                                                }
                                                break;
                default                     :   return this.utils.serialize_object(result.data)
            }
        }
        return 'Unknown Error'
    }


    // Message Handler

    async handle(message) {
        if (this.is_command(message)) {
            // Detected Telegram Command
            return await this.exec_command(message)
        } 
        return false
    }

    // Add Account

    async configAccountsAdd(params) {
        return await this.accounts.add(params)
    }

    // Add Account

    async configAccountsGet(params) {
        return await this.accounts.get(params)
    }


    // Start Telegram Bot

    async start() {
        this.settings = global.frostybot._modules_['settings']
        var token = this.settings.get('telegram', 'token')
        if (token != null) {
          
            const wizardsteps = {
                ftx: [
                    'base',
                    'subaccount'
                ],
                deribit: [
                    'base',
                    'testnet'
                ],
                bitmex: [
                    'base',
                    'testnet'
                ],
                binance: [
                    'base',
                    'testnet'
                ]
            }

            const wizardsubsteps = {
                base: {
                    stub : {
                        type : 'text',
                        prompt : 'Give the account a short <b>name</b> (lowercase, no spaces):',
                    },
                    description : {
                        type : 'text',
                        prompt : 'Provide a <b>description</b> for the account:',
                    },
                    apikey : {
                        type : 'text',
                        prompt : 'Enter the <b>API key</b> for the account:',
                    },
                    secret : {
                        type : 'text',
                        prompt : 'Enter the <b>API secret</b> for the account:',
                    },
                },
                subaccount: {
                    issub : {
                        type : 'yesno',
                        prompt : 'Is this a <b>subaccount</b>?',
                    },
                    subaccount : {
                        type : 'text',
                        prompt : 'Enter the <b>subaccount</b> name exactly as it is on the exchange (case-sensitive):',
                    },
                },
                testnet: {
                    istestnet : {
                        type : 'yesno',
                        prompt : 'Is this a <b>testnet</b> account?',
                    },
                },
            }

            // config:accounts:add:scene

            const configAccountsAddScene = new Scene('config:accounts:add:scene')
            configAccountsAddScene.enter((ctx) => {
                var tenant = md5(ctx.update.callback_query.message.from.id)
                ctx.session['configAccountAdd'] = { tenant: tenant };
                ctx.replyWithHTML("<b>Add New Account</b>", Markup.inlineKeyboard([
                    Markup.callbackButton('FTX', 'config:accounts:add:ftx'),
                    Markup.callbackButton('Deribit', 'config:accounts:add:deribit'),
                    Markup.callbackButton('Bitmex', 'config:accounts:add:bitmex'),
                    Markup.callbackButton('Binance Spot', 'config:accounts:add:binance_spot'),
                    Markup.callbackButton('Binance Futures', 'config:accounts:add:binance_future'),
                ], {columns: 3}).oneTime().extra());
            });
            
            function configAccountsAddSceneLoader(ctx, exchange, type = undefined) {
                var tenant = md5(ctx.update.callback_query.message.from.id)
                ctx.session['configAccountAdd'] = { tenant: tenant, exchange: exchange, type: type };
                ctx.session['configAccountAddSteps'] = wizardsteps[ exchange ];
                ctx.scene.enter('config:accounts:add:base:scene');
                ctx.scene.leave('config:accounts:add:scene');
            }
            
            configAccountsAddScene.action('config:accounts:add:ftx', (ctx) => configAccountsAddSceneLoader(ctx, 'ftx'));
            configAccountsAddScene.action('config:accounts:add:deribit', (ctx) => configAccountsAddSceneLoader(ctx, 'deribit'));
            configAccountsAddScene.action('config:accounts:add:bitmex', (ctx) => configAccountsAddSceneLoader(ctx, 'bitmex'));
            configAccountsAddScene.action('config:accounts:add:binance_spot', (ctx) => configAccountsAddSceneLoader(ctx, 'binance', 'spot'));
            configAccountsAddScene.action('config:accounts:add:binance_futures', (ctx) => configAccountsAddSceneLoader(ctx, 'binance', 'futures'));
            //configAccountsAddBaseScene.leave((ctx) => ctx.reply('Bye'))

            // Add Account Base Wizard
            /*
            const configAccountsAddBaseWizard = new WizardScene(
                'config:accounts:add:base:wizard',
                ctx => {
                    ctx.replyWithHTML('<b>Adding new account for: </b>' + ctx.session.configAccountAdd.exchange + "\n\n" + 'Give the account a short <b>name</b> (lowercase, no spaces):')
                    return ctx.wizard.next();
                },
                ctx => {
                    ctx.session.configAccountAdd['stub'] = ctx.message.text;
                    ctx.replyWithHTML('Provide a <b>description</b> for the account:');
                    return ctx.wizard.next();
                },
                ctx => {
                    ctx.session.configAccountAdd['description'] = ctx.message.text;
                    ctx.replyWithHTML('Enter the <b>API key</b> for the account:');
                    return ctx.wizard.next();
                },
                ctx => {
                    ctx.session.configAccountAdd['apikey'] = ctx.message.text;
                    ctx.replyWithHTML('Enter the <b>API secret</b> for the account:');
                    return ctx.wizard.next();
                },
                ctx => {
                    ctx.session.configAccountAdd['secret'] = ctx.message.text;
                    return ctx.scene.leave();
                },
            );
            */
            
            // Add Account Testnet Wizard
            /*
            const configAccountsAddTestnetWizard = new WizardScene(
                'config:accounts:add:testnet:wizard',
                ctx => {
                    ctx.replyWithHTML('Is this a <b>testnet</b> account?', Markup.inlineKeyboard([
                        Markup.callbackButton('Yes', 'config:accounts:add:istestnet'),
                        Markup.callbackButton('No', 'config:accounts:add:isnottestnet'),
                    ]).resize().extra());
                    return ctx.scene.leave();
                }
            );
            */
            
            // Add Account Subaccount Wizard
            /*
            const configAccountsAddSubaccountWizard = new WizardScene(
                'config:accounts:add:subaccount:wizard',
                ctx => {
                    ctx.replyWithHTML('Is this a <b>subaccount</b>?', Markup.inlineKeyboard([
                        Markup.callbackButton('Yes', 'config:accounts:add:issubaccount'),
                        Markup.callbackButton('No', 'config:accounts:add:isnotsubaccount'),
                    ]).resize().extra());
                    return ctx.scene.leave();
                }
            );
            */


            const stage = new Stage([configAccountsAddScene]);


            this.bot = new Telegraf(token)
            this.bot.use(session())
            this.bot.use(stage.middleware());

            // this.bot.help((ctx) => ctx.reply('Send me a sticker'))
        
            // config:accounts menu

            this.bot.command('accounts', ctx => {
                ctx.replyWithHTML('<b>Account Configuration Menu</b>', Markup.inlineKeyboard([
                    Markup.callbackButton('Add Account', 'config:accounts:add'),
                    Markup.callbackButton('View Accounts', 'config:accounts:view'),
                    Markup.callbackButton('Delete Account', 'config:accounts:delete'),
                ]).resize().oneTime().extra());
                //ctx.scene.enter('super-wizard');
            });


            // config:accounts:add menu

            this.bot.action('config:accounts:add', ctx => {
                ctx.scene.enter('config:accounts:add:scene');
            });
            

            // config:accounts:add:ftx menu

            this.bot.action('config:accounts:add:ftx', ctx => {
                var tenant = md5(ctx.update.callback_query.message.from.id)
                ctx.session['configAccountAdd'] = {
                    tenant: tenant,
                    exchange: 'ftx'
                };
                ctx.scene.enter('config:accounts:add:wizard');
            });
                        

            // config:accounts:add:subaccount options menu

            this.bot.action('config:accounts:add:issubaccount', ctx => {
                ctx.scene.enter('config:accounts:add:getsub:wizard');
            });

            this.bot.action('config:accounts:add:ftx:isnotsub', async(ctx) => {
                var result = await this.configAccountsAdd(ctx.session.configAccountAdd);
                if (result) {
                    ctx.replyWithHTML('<b>SUCCESS: </b>You have successfully added your new account!')
                } else {
                    ctx.replyWithHTML('<b>ERROR: </b>There was an error adding your new account. Please check your API key and secret and try again.')
                }                
            });


            // config:accounts:add:deribit menu

            this.bot.action('config:accounts:add:deribit', ctx => {
                var tenant = md5(ctx.update.callback_query.message.from.id)
                ctx.session['configAccountAdd'] = {
                    tenant: tenant,
                    exchange: 'deribit'
                };
                ctx.scene.enter('config:accounts:add:wizard');
            });
                        


            // config:accounts:view menu

            this.bot.action('config:accounts:view', async(ctx) => {

                var tenant = md5(ctx.update.callback_query.message.from.id)
                var result = await this.configAccountsGet({ tenant: tenant});

                if (this.utils.is_empty(result)) {

                    ctx.replyWithHTML("You do not currently have any accounts configured");

                } else {

                    var accounts = {}
                    for (const [key, value] of Object.entries(result)) {
                        value['stub'] = key
                        for (const [paramkey, paramval] of Object.entries(value.parameters)) {
                            value[paramkey] = paramval
                        }
                        delete value.parameters
                        delete value.tenant
                        delete value.apikey
                        delete value.secret
                        accounts[key] = value
                        
                    }

                    var str = ''
                    for (const [stub, account] of Object.entries(accounts)) {
                        str += '<b><u>' + stub + '</u></b>' + "\n"
                        str += '<pre>' + "\n"
                        for (const [paramkey, paramval] of Object.entries(account)) {
                            if (paramkey != 'stub') {
                                str += ' ' + (paramkey + ':').padEnd(13, ' ') + paramval + "\n"
                            }
                        }
                        str += '</pre>' + "\n"
                    }

                    ctx.replyWithHTML(str);
                }

            });
            



            this.bot.start((ctx) => ctx.reply('Welcome to Frostybot!'))
            
               
            //this.bot.on('message', async (ctx) => ctx.replyWithHTML( await this.handle(ctx.message) ))

            this.bot.launch()
            this.output.notice('telegram_bot_start', token)
            return true;
        }
        return false
    }

}