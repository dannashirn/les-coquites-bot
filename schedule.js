var request = require("request")
var schedule = require("node-schedule")
var apis = require("./config/apis")
var bot = require("./bot")
module.exports = schedule.scheduleJob("*/1 * * * *", () => {
  request.get("https://les-coquites-bot.herokuapp.com/")
})

module.exports = schedule.scheduleJob("*/3 * * * *", () => {
  request.get(apis.subteMyJsonNaxo, function(_, httpResponse, body) {
    if (httpResponse.statusCode != 200) {
      console.log("Subte API Caida", httpResponse)
      return
    }
    var bodyParsed = JSON.parse(body)
    bot.alertSubte(bodyParsed)
  })
})
