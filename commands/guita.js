const axios = require("axios")
const apis = require("../config/apis")
const keys = require("../config/keys")

const displayError = (error, chatId) => {
  if (error) {
    console.log(error)
    bot.sendMessage(
      chatId,
      "There seems to be an issue with the API required for this command, please contact the bot's admins",
    )
  }
}

module.exports = bot => {
  console.log("Guita commands enabled")

  bot.onText(/^\/btc(@LesCoquitesBot)?$/, msg => {
    axios
      .get(apis.btcProAPI, {
        params: {
          id: 1,
        },
        headers: {
          "X-CMC_PRO_API_KEY": keys.bitcoinKey,
        },
      })
      .then(response => {
        bot.sendMessage(
          msg.chat.id,
          "$" + response.data.data["1"].quote.USD.price.toFixed(2),
        )
      })
      .then(error => displayError(error, msg.chat.id))
  })

  bot.onText(/^\/dolar(@LesCoquitesBot)?$/, msg => {
    var chatId = msg.chat.id

    axios
      .get(apis.dolarPiola)
      .then(response => {
        var dolar = response.data
        bot.sendMessage(
          chatId,
          "El oficial está $"
            .concat(dolar[dolar.length - 1].oficial_venta)
            .concat(" y el blue $")
            .concat(dolar[dolar.length - 1].blue_venta),
        )
      })
      .then(error => displayError(error, msg.chat.id))
  })

  bot.onText(/^\/dolar (\d\d\d\d-\d\d-\d\d)$/, msg => {
    var chatId = msg.chat.id
    let date = msg.text
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
      .then(error => displayError(error, msg.chat.id))
  })
}
