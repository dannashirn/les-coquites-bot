var request = require("request")
var schedule = require("node-schedule")
var apis = require("./config/apis")
var bot = require("./bot")
module.exports = schedule.scheduleJob("*/1 * * * *", () => {
  request.get("https://les-coquites-bot.herokuapp.com/")
})