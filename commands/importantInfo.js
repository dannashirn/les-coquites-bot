const axios = require("axios")

module.exports = bot => {
  console.log("Important Info commands enabled")

  bot.onText(/coronavirus(@LesCoquitesBot)?/, msg => {
    axios
      .get("https://d1q0nvr1cscr0c.cloudfront.net/coronavirus/coronavirus.json")
      .then(response => {
        var message = ""
        const items = response.data.items
        for (i in items) {
          const item = items[i]
          console.log(item.currency.length)
          if (item.currency.length > 0) {
            message = message.concat(
              item.currency,
              ": ",
              item.unico / 1000,
              "\n",
            )
          }
        }
        bot.sendMessage(msg.chat.id, message)
      })
  })
}
