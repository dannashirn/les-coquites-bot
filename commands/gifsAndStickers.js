module.exports = bot => {
  console.log("Gifs and Stickers commands enabled")

  bot.onText(/^\/o+h+(@LesCoquitesBot)?$/, msg => {
    const chatId = msg.chat.id
    bot.sendVideo(
      chatId,
      "https://media.giphy.com/media/AT6LbRAazEoPm/giphy.gif",
    )
  })

  bot.onText(/^\/papu/, msg => {
    bot.sendSticker(msg.chat.id, "CAADAQADjAAD_naARKO8xnUVfTJcAg")
  })

  bot.onText(/^\/killme(@LesCoquitesBot)?$/, msg => {
    bot.sendVideoNote(msg.chat.id, "DQADAQADSgADkP7QRKT2myzp1DPoAg")
  })

  bot.onText(/buen(os)? d(í|i)a(s)?/i, msg => {
    bot.sendSticker(msg.chat.id, "CAADAQADCQADlVU3E--Nax_-949JAg")
  })
}
