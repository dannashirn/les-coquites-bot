function achinosar(text) {
  return text
    .toLowerCase()
    .replace(/[a|á|ä|e|é|ë|o|ó|ö|u|ú|ü]/g, "i")
    .replace(/ci/g, "ki")
}

module.exports = bot => {
  console.log("Stupid text commands enabled")

  bot.onText(/^\/hi(@LesCoquitesBot)?$/, msg => {
    const chatId = msg.chat.id
    switch (msg.from.first_name) {
      case "Tobias":
        bot.sendMessage(
          chatId,
          "Muy buenos días amo " +
            msg.from.first_name +
            ". Cómo puedo ayudarlo hoy?",
        )
        break
      case "Coca":
        bot.sendMessage(chatId, "Buen dia Coca, como andan tus hijitos?")
        break
      case "Nadia":
        bot.sendMessage(chatId, "Qué hay de nuevo Doc?")
        break
      case "Kevin":
        bot.sendMessage(chatId, "Hoolaa, mi amor!")
        break
      default:
        bot.sendMessage(chatId, "Hola " + msg.from.first_name)
    }
  })

  bot.onText(/^\/libertad(@LesCoquitesBot)?$/, msg => {
    var now = new Date()
    var today = now.getDay()
    var chatId = msg.chat.id

    if (today == 6 || today == 0) {
      bot.sendMessage(chatId, "Hoy sos 'libre', aunque sea por un rato...")
    } else if (now.getHours() >= 21 || now.getHours() <= 11) {
      bot.sendMessage(
        chatId,
        "La tortura diaria ya terminó, o no empezó, como quieras verlo...",
      )
    } else {
      var timeTil6 = String(20 - now.getHours())
      var minTilNextHour = String(59 - now.getMinutes())
      if (60 - now.getMinutes() < 10) {
        minTilNextHour = "0".concat(minTilNextHour)
      }
      bot.sendMessage(
        chatId,
        "Faltan " +
          timeTil6 +
          ":" +
          minTilNextHour +
          " horas para la libertad. Algún día, todos seremos libres.",
      )
    }
  })

  bot.onText(/^\/lucio(@LesCoquitesBot)?/, msg => {
    const chatId = msg.chat.id
    var text = msg.text.split("/lucio ").pop()
    bot.sendMessage(chatId, text.toUpperCase())
  })

  bot.onText(/^\/chinito(@LesCoquitesBot)?/, msg => {
    const chatId = msg.chat.id
    bot.sendSticker(chatId, "CAADAQADMQAD8Pe7Aj5g8hWbOkDRAg")
    if (msg.reply_to_message) {
      bot.sendMessage(chatId, achinosar(msg.reply_to_message.text))
    } else {
      var text = msg.text.split("/chinito ").pop()
      bot.sendMessage(chatId, achinosar(text))
    }
  })

  bot.onText(/(facu)|(facultad)/i, msg => {
    switch (msg.from.first_name) {
      case "Nadia":
      case "Bianca":
        bot.sendMessage(
          msg.chat.id,
          "No jodas, vos ya terminaste la facultad " + msg.from.first_name,
        )
        break
      case "Franco":
        bot.sendMessage(
          msg.chat.id,
          "Al fin alquien que me hace caso y deja la facultad " +
            msg.from.first_name,
        )
        break
      default:
        bot.sendMessage(
          msg.chat.id,
          "Deja la facultad de una vez " + msg.from.first_name,
        )
    }
  })

  bot.onText(/qu(e|é) hacemos esta noche\??/i, msg => {
    if (
      new Date().setHours(0, 0, 0) >=
      new Date(after.getTime()).setHours(0, 0, 0)
    ) {
      var suffix = " (despues de agarrarnos un pedo bárbaro en el after)"
    } else {
      var suffix = ""
    }
    bot.sendMessage(
      msg.chat.id,
      "Lo mismo que hacemos todas las noches " +
        msg.from.first_name +
        ", tratar de conquistar al mundo!" +
        suffix,
    )
  })
}
