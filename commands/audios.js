const axios = require("axios")
const apis = require("../config/apis")

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
  console.log("Audios commands enabled")

  bot.onText(/^\/atr(@LesCoquitesBot)?$/, msg => {
    axios
      .get(apis.atr)
      .then(response => {
        var audios = response.data
        bot.sendAudio(
          msg.chat.id,
          audios[Math.floor(Math.random() * audios.length)],
        )
      })
      .then(error => displayError(error, msg.chat.id))
  })

  bot.onText(/^\/boruro(@LesCoquitesBot)?$/, msg => {
    axios.get(apis.boruro).then(response => {
      bot.sendAudio(msg.chat.id, response.data[0])
    })
  })
}
