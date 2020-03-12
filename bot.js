var moment = require("moment")
moment().format()
var express = require("express")
var bodyParser = require("body-parser")
var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
var http = require("http").Server(app)
var request = require("request")
var TelegramBot = require("node-telegram-bot-api")
var zlib = require("zlib")
var keys = require("./config/keys")
var token = keys.token
var apis = require("./config/apis")

var bot = new TelegramBot(token, { polling: true })

bot.on("polling_error", err => console.log(err))

// Commands
require("./commands/stupidText")(bot)
require("./commands/gifsAndStickers")(bot)
require("./commands/guita")(bot)
require("./commands/audios")(bot)

const bsasKey = 7894

const oneDayInMillis = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds

app.get("/", function(req, res) {
  res.send("OK")
})

// Needs refactor
bot.onText(/^\/feriados(@LesCoquitesBot)?$/, msg => {
  var mesActual = new Date().getMonth() + 1
  request.get(apis.feriadosApi, function(err, httpResponse, body) {
    var feriados = JSON.parse(body)
    var feriadosDelMes = feriados.filter(f => f.mes === mesActual)
    var feriadosMostrables = feriadosDelMes.map(f =>
      mostrarFeriadoEnLinea(f, mesActual),
    )
    bot.sendMessage(msg.chat.id, feriadosMostrables.join("\r\n"))
  })
})

bot.onText(/^\/proximoferiado(@LesCoquitesBot)?$/, msg => {
  var mesActual = new Date().getMonth() + 1
  request.get(apis.feriadosApi, function(err, httpResponse, body) {
    var feriados = JSON.parse(body)
    var feriado = proximoFeriado(feriados)
    var feriadoMostrable = mostrarFeriadoEnLinea(feriado, mesActual)
    var diasRestantes = diasHastaFeriado(feriado)
    bot.sendMessage(
      msg.chat.id,
      "Faltan " +
        diasRestantes +
        " dias para el proximo feriado\r\n" +
        feriadoMostrable,
    )
  })
})

function proximoFeriado(feriados) {
  var today = new Date()
  var proximos = feriados.filter(f => f.mes >= today.getMonth() + 1)
  if (
    proximos[0].mes == today.getMonth() + 1 &&
    proximos[0].dia <= today.getDate()
  ) {
    return proximoFeriado(proximos.slice(1))
  } else {
    return proximos[0]
  }
  //[0];
}

function diasHastaFeriado(feriado) {
  var firstDate = new Date()
  var secondDate = new Date(
    firstDate.getFullYear(),
    feriado.mes - 1,
    feriado.dia,
    3,
  )

  return Math.ceil(
    Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDayInMillis),
  )
}

function mostrarFeriadoEnLinea(feriado, mesActual) {
  return (
    feriado.motivo +
    "(" +
    feriado.tipo +
    ") " +
    "dia: " +
    feriado.dia +
    "/" +
    feriado.mes
  )
}

bot.onText(/^\/nasa(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id
  request.get(apis.nasaAPI, function(err, httpResponse, body) {
    var nasa = JSON.parse(body)
    bot.sendPhoto(chatId, nasa.hdurl)
  })
})

bot.onText(/^\/nasatext(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id
  request.get(apis.nasaAPI, function(err, httpResponse, body) {
    var nasa = JSON.parse(body)
    bot.sendMessage(chatId, nasa.explanation)
    bot.sendPhoto(chatId, nasa.hdurl)
  })
})

bot.onText(/^\/subte(@LesCoquitesBot)?$/, msg => {
  request.get(apis.subteMyJsonNaxo, function(err, httpResponse, body) {
    var estados = JSON.parse(body)
    var showableStatuses = showStatus(estados)
    bot.sendMessage(msg.chat.id, showableStatuses)
  })
})

function showStatus(estados) {
  var map = new Map(Object.entries(estados))
  var showable = []
  map.forEach((v, k, o) => {
    showable.push("Linea " + k + ": " + v.text)
  })
  return showable.join("\r\n")
}

var port = process.env.PORT || 3000
http.listen(port, function() {
  console.log("listening on *:" + port)
})

bot.onText(/^\/proximoafter(@LesCoquitesBot)?$/, msg => {
  bot.sendMessage(msg.chat.id, "Lamentablemente ya no hay más afters")
})

bot.onText(/^\/chucknorris(@LesCoquitesBot)?/, msg => {
  request.get(apis.chuckNorris, (err, httpResponse, body) => {
    var joke = JSON.parse(body)
    bot.sendMessage(msg.chat.id, joke.value)
  })
})

bot.onText(/^\/random [\d]+-[\d]+$/, msg => {
  var numbers = msg.text
    .split("/random ")
    .pop()
    .split("-")

  var min = numbers[0]
  var max = numbers[1]

  if (min < max) {
    var randomNumber = Math.ceil(Math.random() * (max - min + 1) + min)
    bot.sendMessage(msg.chat.id, randomNumber)
  } else {
    bot.sendMessage(msg.chat.id, "Primero el min despues el max pelotudo.")
  }
})

//Agregar tareas por hacer
bot.onText(/^\/todo [a-zA-Z0-9_ ]*/, msg => {
  var text = msg.text.split("/todo ").pop()
  var todoListSaved
  request.get(apis.todoList, function(err, httpResponse, body) {
    todoListSaved = JSON.parse(body)
    var newTodo = {}
    newTodo.text = text
    newTodo.state = "☓"
    todoListSaved.push(newTodo)
    request(
      { url: apis.todoList, method: "PUT", json: todoListSaved },
      function(request, response) {
        bot.sendMessage(msg.chat.id, "TodoList Updated")
      },
    )
  })
})

//Consuntal lista de tareas
bot.onText(/^\/todolist/, msg => {
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body)
    if (todoList.length !== 0) {
      var todoListMostrable = todoList.map(a =>
        mostrarTareaEnLinea(a, todoList.indexOf(a)),
      )
      todoListMostrable = todoListMostrable.join("\r\n")
      bot.sendMessage(msg.chat.id, todoListMostrable)
    } else {
      bot.sendMessage(msg.chat.id, "Todo list vacia")
    }
  })
})

//Mark todo list
bot.onText(/^\/checktodo [0-9]\d?\d?/, msg => {
  var idTodo = parseInt(msg.text.split("/checktodo ").pop())
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body)
    if (idTodo >= todoList.length) {
      bot.sendMessage(msg.chat.id, "No existe tarea.")
      return
    }

    todoList[idTodo].state = "✓"
    request({ url: apis.todoList, method: "PUT", json: todoList }, function(
      request,
      response,
    ) {
      bot.sendMessage(msg.chat.id, "OK: tarea id: " + idTodo)
    })
  })
})

//Reset todolist
bot.onText(/^\/resettodolist/, msg => {
  request({ url: apis.todoList, method: "PUT", json: [] }, function(
    request,
    response,
  ) {
    bot.sendMessage(msg.chat.id, "Reset todo list")
  })
})

function mostrarTareaEnLinea(tarea, index) {
  return index + " | " + tarea.state + " | " + tarea.text
}

bot.onText(/^\/cleanchecked(@LesCoquitesBot)?$/, msg => {
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body)
    todoList = todoList.filter(elem => elem.state === "☓")

    request({ url: apis.todoList, method: "PUT", json: todoList }, function() {
      bot.sendMessage(msg.chat.id, "Checked items borrados")
    })
  })
})

bot.onText(/^\/unchecktodo [0-9]\d?\d?/, msg => {
  var idTodo = parseInt(msg.text.split("/unchecktodo ").pop())
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body)
    if (idTodo >= todoList.length) {
      bot.sendMessage(msg.chat.id, "No existe tarea.")
      return
    }

    todoList[idTodo].state = "☓"
    request({ url: apis.todoList, method: "PUT", json: todoList }, function(
      request,
      response,
    ) {
      bot.sendMessage(msg.chat.id, "Destildada tarea " + idTodo)
    })
  })
})

/////////////////////////////////////SUBTE AUTOMATICO///////////////////////////////////
module.exports = {
  alertSubte: function(bodyParsed) {
    request.get(apis.subtePersistido, function(_, _, body) {
      if (showStatus(JSON.parse(body)) != showStatus(bodyParsed)) {
        request.get(apis.suscripcionSubte, function(
          err,
          httpResponse,
          bodySecond,
        ) {
          listaChatId = JSON.parse(bodySecond)
          listaChatId.forEach(function(chatId) {
            bot.sendMessage(chatId, showStatus(bodyParsed))
          })
        })
      }
      request({ url: apis.subtePersistido, method: "PUT", json: bodyParsed })
    })
  },
}

bot.onText(/^\/subscribesubte(@LesCoquitesBot)?$/, msg => {
  chatId = msg.chat.id
  request.get(apis.suscripcionSubte, function(err, httpResponse, body) {
    var lista = JSON.parse(body)
    if (lista.includes(chatId)) {
      bot.sendMessage(chatId, "Este chat ya está suscripto!")
    } else {
      lista.push(chatId)
      request({ url: apis.suscripcionSubte, method: "PUT", json: lista })
      bot.sendMessage(
        chatId,
        "Te suscribiste exitosamente a las notificaciones del subte",
      )
    }
  })
})

bot.onText(/^\/unsubscribesubte(@LesCoquitesBot)?$/, msg => {
  chatId = msg.chat.id
  request.get(apis.suscripcionSubte, function(err, httpResponse, body) {
    var lista = JSON.parse(body)
    if (lista.includes(chatId)) {
      lista.splice(lista.indexOf(chatId), 1)
      bot.sendMessage(
        chatId,
        "Te borraste exitosamente de las notificaciones del subte",
      )
      request({ url: apis.suscripcionSubte, method: "PUT", json: lista })
    } else {
      bot.sendMessage(chatId, "Este chat no está suscripto!")
    }
  })
})

bot.onText(/^\/weather(@LesCoquitesBot)?$/, msg => {
  request(
    { url: apis.weather + bsasKey, qs: { apikey: keys.weather } },
    (err, httpResponse, body) => {
      if (httpResponse.statusCode != 200) {
        bot.sendMessage(
          msg.chat.id,
          "There has been an error:\r\n" + JSON.parse(body).Message,
        )
        return
      }
      if (httpResponse.headers["content-encoding"] == "gzip") {
        zlib.gunzip(body, function(err, dezipped) {
          showWeather(msg.chat.id, JSON.parse(dezipped)[0])
        })
      } else {
        showWeather(msg.chat.id, JSON.parse(body)[0])
      }
    },
  )
})

function showWeather(chatId, weather) {
  bot.sendMessage(
    chatId,
    "Weather in Buenos Aires: " +
      weather.WeatherText +
      "\r\nTemperature: " +
      weather.Temperature.Metric.Value +
      "°",
  )
}

bot.onText(/^\/[Y|y]ou[T|t]ube [0-9a-zA-Zñáéíóúü ]*$/i, msg => {
  var q = msg.text.split("/youtube").pop()
  if (msg.from.username) {
    var displayName = msg.from.username
  } else {
    var displayName = msg.from.first_name
  }
  request.get(
    {
      url: apis.youtube,
      qs: { part: "id", q: q, key: keys.google, maxResults: 1 },
    },
    (err, res, body) => {
      if (res.statusCode == 403) {
        bot.sendMessage("Aflojenle un poco muchachos")
        return
      }
      var items = JSON.parse(body).items
      var videoId
      var message
      if (items.length > 0) {
        videoId = items[0].id.videoId
        bot.deleteMessage(msg.chat.id, msg.message_id).catch(err => {})
        message =
          "Aca tenes " +
          displayName +
          "\r\n" +
          "https://www.youtube.com/watch?v=" +
          videoId
      } else {
        message =
          "No encontré nada, así que te paso este: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      }

      bot.sendMessage(msg.chat.id, message)
    },
  )
})

require("./schedule")

bot.onText(/^\/[W|w]ikipedia(@LesCoquitesBot)?/, msg => {
  if (msg.from.username) {
    var displayName = msg.from.username
  } else {
    var displayName = msg.from.first_name
  }

  /*  const languages = {
      reply_markup: {
        inline_keyboard:
        [[{
          text: 'Español',
          callback_data: 'ES'
        }],
        [{
          text: 'Ingles',
          callback_data: 'EN'
        }]]
      }
    };
  
    bot.sendMessage(msg.chat.id, "Selecciona el idioma que quieras", languages);
  
    bot.on('callback_query', function onCallbackQuery(callbackQuery) {
      const lan = callbackQuery.data;
  
      if (lan === 'EN'){
        var wiki_api = apis.wikipediaEN;
        var wik_url = "https://en.wikipedia.org/?curid=";
        console.log("INGLES")
      }else if (lan === 'ES'){
        var wiki_api = apis.wikipediaES;
        var wiki_url = "https://es.wikipedia.org/?curid=";
      }
  
    });*/

  var query = encodeURIComponent(
    msg.text
      .toLowerCase()
      .split("/wikipedia ")
      .pop(),
  )
  request.get(apis.wikipediaES.concat(query), (err, response, body) => {
    const wiki_url = "https://es.wikipedia.org/?curid="
    //const wiki_url_en = "https://en.wikipedia.org/?curid=";

    var articulos = JSON.parse(body).query.search.slice(0, 3)

    var buttons = []
    for (var i = 0; i < articulos.length; i++) {
      buttons.push([
        {
          text: articulos[i].title,
          callback_data: i,
        },
      ])
    }

    const arts = {
      reply_markup: {
        inline_keyboard: buttons,
      },
    }
    bot.deleteMessage(msg.chat.id, msg.message_id).catch(err => {})
    bot.sendMessage(msg.chat.id, "Selecciona el artículo que quieras", arts)

    bot.on("callback_query", function onCallbackQuery(callbackQuery) {
      const order = callbackQuery.data
      const msg = callbackQuery.message

      var text =
        "Aca tenes " + displayName + "\r\n" + wiki_url + articulos[order].pageid

      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        text: text,
      }

      bot.editMessageText(text, opts)
    })
  })
})
