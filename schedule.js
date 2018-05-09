var request = require('request');
var schedule = require("node-schedule")

module.exports = schedule.scheduleJob("*/1 * * * *", () => {
  request.get("https://botback.herokuapp.com/")
})