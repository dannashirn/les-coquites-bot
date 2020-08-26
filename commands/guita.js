const axios = require("axios")
const apis = require("../config/apis")
const keys = require("../config/keys")

const displayError = (bot, error, chatId) => {
  if (error) {
    console.log(error)
    bot.sendMessage(
      chatId,
      "There seems to be an issue with the API required for this command, please contact the bot's admins.",
    )
  }
}

const cryptoIds = {BTC: "1", ETH: "1027"};
const getCoinbaseParams = crypto => cryptoIds[crypto] ? { id: cryptoIds[crypto] } : { symbol: crypto };

const getCryptoValue = crypto => {
      const symbolOrId = cryptoIds[crypto] ? cryptoIds[crypto] : crypto;
      return axios.get(apis.btcProAPI, {
          params: getCoinbaseParams(crypto),
          headers: {
            "X-CMC_PRO_API_KEY": keys.bitcoinKey,
          },
        })
        .then(response => response.data.data[symbolOrId].quote.USD.price.toFixed(2))
        .catch(error => {throw error})}

const sendCryptoValue = (crypto, bot, chatId) => {
  getCryptoValue(crypto)
      .then(cryptoValue => {
        bot.sendMessage(chatId, "$" + cryptoValue)
      })
      .catch(error => {
        if(error.response.status === 400){
          bot.sendMessage(chatId, crypto + ' no existe, por lo que nada te impide crearla.')
        } else{
          displayError(bot, error, chatId)
        }
      })
}


module.exports = bot => {
  console.log("Guita commands enabled")

  bot.onText(/^\/btc(@LesCoquitesBot)?$/, msg => {
    const chatId = msg.chat.id;
    sendCryptoValue('BTC', bot, chatId);
  })

  bot.onText(/^\/eth(@LesCoquitesBot)?$/, msg => {
    const chatId = msg.chat.id;
    sendCryptoValue('ETH', bot, chatId);
  })

  bot.onText(/^\/crypto [a-zA-Z]+(@LesCoquitesBot)?/, msg => {
    const chatId = msg.chat.id;
    const crypto = msg.text.split("/crypto ").pop().toUpperCase();
    if(crypto && (crypto.length === 3 || crypto.length === 4)){
      sendCryptoValue(crypto, bot, chatId)
    }else {
      bot.sendMessage(chatId, 'Pero mandame un simbolo valido...')
    }
  })

  bot.onText(/^\/dolar(@LesCoquitesBot)?$/, msg => {
    const chatId = msg.chat.id

    axios
      .get(apis.dolarPiola)
      .then(response => {
        var dolar = response.data
        bot.sendMessage(
          chatId,
          "El oficial está $"
            .concat(dolar[dolar.length - 1].oficial_venta)
            .concat(", el \"solidario \" está $")
            .concat((dolar[dolar.length - 1].oficial_venta * 1.3).toFixed(2))
            .concat(" y el blue $")
            .concat(dolar[dolar.length - 1].blue_venta),
        )
      })
      .then(error => displayError(bot, error, chatId))
  })

  bot.onText(/^\/dolar (\d\d\d\d-\d\d-\d\d)$/, msg => {
    const chatId = msg.chat.id
    const date = msg.text
      .split("dolar")
      .pop()
      .trim()

    axios
      .get(apis.dolarPiola)
      .then(response => {
        var dolar = response.data
        const buscado = dolar.find(({ fecha }) => fecha === date)

        if (buscado) {
          bot.sendMessage(
            chatId,
            "El " +
              date +
              " el oficial estaba $"
                .concat(buscado.oficial_venta)
                .concat(" y el blue $")
                .concat(buscado.blue_venta),
          )
        } else {
          bot.sendMessage(chatId, "No encontré cotización para ese día")
        }
      })
      .then(error => displayError(bot, error, chatId))
  })
}
