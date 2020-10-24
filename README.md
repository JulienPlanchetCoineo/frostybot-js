![logo](https://i.imgur.com/YAME6yT.png "#FrostyBot")

## Summary

FrostyBot-JS is an API endpoint for REST and webhooks that is designed to receive API requests, such as Tradingview webhooks, and to submit them as orders to a cryptocurrency exchange.

The way it works is simple:

* There are four main trading commands, namely: 
  * **long** : Create a long order for the size provided. If you are already long, the order size will be adjusted so that the resulting position size equals the size your provided. If you are currently short, the order size will be adjusted so that your resulting position will be long the size you requested.
  * **short** : The inverse of the long command above
  * **buy**: Will create a simple order that will buy the amount requested
  * **sell**: The inverse of the buy order above
  * **close**: To reduce or close your current position. The size can be provided as a percentage, in case you would like to close 15% of your position (as an example)
  * **cancel**: To cancel one or more existing open orders
  Depending on the parameters you give these commands, you can open long or short positions, close positions, take profit (partial close) or cancel existing unfilled orders. The bot supports both limit and market orders and the commands are triggered either via a Tradingview alert webhook, or manually by you via the commandline.
* The size of the order is given using the size=xxx parameter (which automatically converts to USD sizing, even for non-USD pairs). Alternatively you can size the order by the base or quote currencies by using the base=xxx or quote=xxx parameters respectively.
* If you specify the price using the price=xxx parameter, a limit order will be used. If you omit the price, a market order will be used at the current market price.
* Anything that can trigger a webhook (like an alert in Tradingview) can be used with this bot for trade execution.

## Authors

Developers listed below can normally be found on the [FrostyBot Discord Server](https://discord.gg/yK4U93s). They are also known to frequent #the-lab channel on [Krown's Crypto Cave Discord Server](https://discordapp.com/invite/hzKU7qe):

* FrostyAF
* Barnz
* SemiQuasi

We kindly ask that you fully **read the documentation** before requesting any support, as most of the questions we get asked are already well documented.

## Donations

If you love this software, and would like to contribute, we accept donations in Bitcoin. Any donations will be shared evenly amoungst all active developers. Our waller addresses are as follows:

* **BTC**: xxx
* **ETH**: xxx
* **LTC**: xxx

## Disclaimer
Use this API at your own risk. The authors accept no responsibility for losses incurred through using this software. This is a 0.x release which means it's beta software. So it may and probably will have some bugs. We strongly advise you to use a sub-account with a limited balance, or a testnet account to ensure that the bot is profitable before going live with any strategy. While we have gone to great lengths to test the software, if you do find any bugs, please report them to us in the [FrostyBot Discord Server](https://discord.gg/yK4U93s) or on Github, and we will sort them out. Remember that risk management is your responsibility. If you lose your account, that's entirely on you.

## Supported Exchanges
Currently only FTX is supported. But we will add support for Deribit, Binance (Spot and Futures), and Bitmex in the near future. These exchanges are already supported on the PHP version of Frostybot, which you can find on this Github

## Scope      
This bot is specifically designed to execute orders based on webhook or REST API requests. These can be from Tradingview, or any other software that can execute webhooks.

While is may seem a little complicated to setup and configure for novices, the point of Frostybot is that it's entirely free. You retain total control over your API keys and trading engine. It is perfect for integration projects where you have a trading engine (like a Tradingview strategy or some custom Python script) that you want to integrate with your exchange.

## Requirements
In order to use Frostybot, you will need the following:
* A Linux server, preferably running Ubuntu 20.04 LTS  (we recommend Amazon Lightsail for this purpose)
* A public static IP address

## Installation

To install Frostybot-JS on Ubuntu 20.04 LTS, run these commands:
```
curl -sk https://frostybot.s3.eu-west-3.amazonaws.com/install -o /tmp/install.sh
sudo chmod +x /tmp/install.sh
sudo /tmp/install.sh
````
If you would like to monitor the install progress, you can tail the installer log file at /tmp/install.log

Alternatively, the latest docker image is available at frostyio/frostybot-js:latest

## Usage

We will add some usage examples here in the next day or two, but for the moment there are plenty of examples on our Discord server
 
## Report Bugs

If you find a bug in the software, kindly report it [here](https://github.com/CryptoMF/frostybot-js/issues/new) so that we can properly track it.
