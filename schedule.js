var request = require('request');
var schedule = require("node-schedule")
var apis = require('./config/apis')

module.exports =
  schedule.scheduleJob("*/1 * * * *", () => {
    request.get("https://botback.herokuapp.com/")
  })


module.exports =
    schedule.scheduleJob("*/1 * * * *", () => {
    request.get(apis.haySubte, function(err, httpResponse, body) {
      request({url:apis.subtePersistido, method:'PUT', json: JSON.parse(body)})
    })
  })
