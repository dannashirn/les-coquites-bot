var request = require('request');
var schedule = require("node-schedule")
var apis = require('./config/apis')
var bot = require('./bot')
console.log(bot);
module.exports =
  schedule.scheduleJob("*/1 * * * *", () => {
    request.get("https://botback.herokuapp.com/")
  })

module.exports =
    schedule.scheduleJob("*/1 * * * *", () => {
    request.get(apis.haySubte, function(err, httpResponse, body) {
      console.log("test");
      var bodyParsed = JSON.parse(body);
      console.log(bodyParsed);
      bot.alertSubte(bodyParsed);
      request({url:apis.subtePersistido, method:'PUT', json: JSON.parse(body)})
    })
  })
