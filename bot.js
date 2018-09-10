var moment = require("moment");
moment().format();
("use strict");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var http = require("http").Server(app);
var request = require("request");
var TelegramBot = require("node-telegram-bot-api");
var zlib = require("zlib");
var keys = require("./config/keys");
var token = keys.token;
var apis = require("./config/apis");
const ids = require("./config/id");
var bot = new TelegramBot(token, { polling: true });
const GoogleSpreadsheet = require("google-spreadsheet");
const food = [
  "mc",
  "dandy",
  "office cook",
  "lupita",
  "central market",
  "tu mama",
  "havanna",
  "mostaza",
  "el chino",
  "el italiano"
];
const bsasKey = 7894;
const poroteoSheet = "1mOiTT3JIdQPxVLTQ-a3OivQqE15oLvdWMv6I_DpMZak";
const tobiIsSad = "DQADAQADSgADkP7QRKT2myzp1DPoAg";

const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

app.get("/", function(req, res) {
  res.send("OK");
});

bot.onText(/^\/hi(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id;
  console.log(chatId);
  switch (msg.from.first_name) {
    case "Tobias":
      bot.sendMessage(
        chatId,
        "Muy buenos días amo " +
          msg.from.first_name +
          ". Cómo puedo ayudarlo hoy?"
      );
      break;
    case "Coca":
      bot.sendMessage(chatId, "Buen dia Coca, como andan tus hijitos?");
      break;
    case "Nadia":
      bot.sendMessage(chatId, "Qué hay de nuevo Doc?");
      break;
    case "Kevin":
      bot.sendMessage(chatId, "Hoolaa, mi amor!");
      break;
    default:
      bot.sendMessage(chatId, "Hola " + msg.from.first_name);
  }
});

bot.onText(/^\/null(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Null");
});

bot.onText(/^\/o+h+(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id;
  bot.sendVideo(
    chatId,
    "https://media.giphy.com/media/AT6LbRAazEoPm/giphy.gif"
  );
});

bot.onText(/^\/feriados(@LesCoquitesBot)?$/, msg => {
  var mesActual = new Date().getMonth() + 1;
  request.get(apis.feriadosApi, function(err, httpResponse, body) {
    var feriados = JSON.parse(body);
    var feriadosDelMes = feriados.filter(f => f.mes === mesActual);
    var feriadosMostrables = feriadosDelMes.map(f =>
      mostrarFeriadoEnLinea(f, mesActual)
    );
    bot.sendMessage(msg.chat.id, feriadosMostrables.join("\r\n"));
  });
});

bot.onText(/^\/proximoferiado(@LesCoquitesBot)?$/, msg => {
  var mesActual = new Date().getMonth() + 1;
  request.get(apis.feriadosApi, function(err, httpResponse, body) {
    var feriados = JSON.parse(body);
    var feriado = proximoFeriado(feriados);
    var feriadoMostrable = mostrarFeriadoEnLinea(feriado, mesActual);
    var diasRestantes = diasHastaFeriado(feriado);
    bot.sendMessage(
      msg.chat.id,
      "Faltan " +
        diasRestantes +
        " dias para el proximo feriado\r\n" +
        feriadoMostrable
    );
  });
});

function proximoFeriado(feriados) {
  var today = new Date();
  var proximos = feriados.filter(f => f.mes >= today.getMonth() + 1);
  if (
    proximos[0].mes == today.getMonth() + 1 &&
    proximos[0].dia <= today.getDate()
  ) {
    return proximoFeriado(proximos.slice(1));
  } else {
    return proximos[0];
  }
  //[0];
}

function diasHastaFeriado(feriado) {
  var firstDate = new Date();
  var secondDate = new Date(
    firstDate.getFullYear(),
    feriado.mes - 1,
    feriado.dia,
    3
  );

  return Math.ceil(
    Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)
  );
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
  );
}

bot.onText(/^\/btc(@LesCoquitesBot)?$/, msg => {
  request.get(apis.btcAPI, function(err, httpResponse, body) {
    var btc = JSON.parse(body);
    bot.sendMessage(msg.chat.id, "$" + btc.data.quotes.USD.price);
  });
});

bot.onText(/^\/nasa(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id;
  request.get(apis.nasaAPI, function(err, httpResponse, body) {
    var nasa = JSON.parse(body);
    bot.sendPhoto(chatId, nasa.hdurl);
  });
});

bot.onText(/^\/nasatext(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id;
  request.get(apis.nasaAPI, function(err, httpResponse, body) {
    var nasa = JSON.parse(body);
    bot.sendMessage(chatId, nasa.explanation);
    bot.sendPhoto(chatId, nasa.hdurl);
  });
});

bot.onText(/^\/subte(@LesCoquitesBot)?$/, msg => {
  request.get(apis.subtePersistido, function(err, httpResponse, body) {
    var estados = JSON.parse(body);
    var showableStatuses = showStatus(estados);
    bot.sendMessage(msg.chat.id, showableStatuses);
  });
});

function showStatus(estados) {
  var map = new Map(Object.entries(estados));
  var showable = [];
  map.forEach((v, k, o) => {
    showable.push("Linea " + k + ": " + v.text);
  });
  return showable.join("\r\n");
}

bot.on("new_chat_participant", function(msg) {
  bot.sendMessage(msg.chat.id, "Bienvenido " + msg.from.first_name);
});

var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log("listening on *:" + port);
});

bot.onText(/^\/juevesdecubalibre(@LesCoquitesBot)?$/, msg => {
  var days = (11 - new Date().getDay()) % 7;
  var showable = showDiasHastaJuevesDeCubaLibre(days);
  bot.sendMessage(msg.chat.id, showable);
});

function showDiasHastaJuevesDeCubaLibre(days) {
  switch (days) {
    case 0:
      return "Hoy es jueves de cuba libre!!!";
      break;
    case 1:
      return "Mañana es jueves de cuba libre!!!";
      break;
    default:
      return "Faltan " + days + " dias para el jueves de cuba libre :(";
  }
}

bot.onText(/^\/pokemon [1-9]\d?\d?/, msg => {
  const chatId = msg.chat.id;
  var pokemon_number = msg.text.split("/pokemon ").pop();
  console.log(apis.pokedex.concat(pokemon_number));
  request.get(apis.pokedex.concat(pokemon_number), function(
    err,
    httpResponse,
    body
  ) {
    if (httpResponse.statusCode == 200) {
      var pokemon = JSON.parse(body);
      bot.sendPhoto(chatId, pokemon.sprites.front_default, {
        caption: pokemon.name
      });
    } else if (httpResponse.statusCode == 504) {
      bot.sendMessage(
        chatId,
        "En estos momentos todos nuestros operadores se encuentran ocupados. Intente nuevamente mas tarde."
      );
    } else {
      bot.sendMessage(chatId, "Envia un numero de pokemon valido");
    }
  });
});

var after = new Date(2018, 7, 22, 20, 30, 0, 0);

bot.onText(/^\/proximoafter(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id;
  var today = new Date();

  if (after > today) {
    if ((after - today) / oneDay < 1) {
      var remainingTime = new Date(after.getTime() - today.getTime());
      var hours = remainingTime.getHours();
      var minutes = remainingTime.getMinutes();
      bot.sendMessage(
        chatId,
        "Faltan " + hours + ":" + minutes + " para el after!!!"
      );
    } else if ((after - today) / oneDay < 2) {
      bot.sendMessage(chatId, "El after en Madero es mañana");
    } else {
      bot.sendMessage(
        chatId,
        "Faltan "
          .concat(Math.floor((after - today) / oneDay) + 1)
          .concat(" dias para el proximo after en Madero")
      );
    }
  } else {
    bot.sendMessage(
      chatId,
      "El after ya paso, pero como siguen resacosos, no me cargaron cuando es el proximo"
    );
  }
});

bot.onText(/^\/libertad(@LesCoquitesBot)?$/, msg => {
  var now = new Date();
  var today = now.getDay();
  var chatId = msg.chat.id;

  if (today == 6 || today == 0) {
    bot.sendMessage(chatId, "Hoy sos 'libre', aunque sea por un rato...");
  } else if (now.getHours() >= 21 || now.getHours() <= 11) {
    bot.sendMessage(
      chatId,
      "La tortura diaria ya terminó, o no empezó, como quieras verlo..."
    );
  } else {
    var timeTil6 = String(20 - now.getHours());
    var minTilNextHour = String(59 - now.getMinutes());
    if (60 - now.getMinutes() < 10) {
      minTilNextHour = "0".concat(minTilNextHour);
    }
    bot.sendMessage(
      chatId,
      "Faltan " +
        timeTil6 +
        ":" +
        minTilNextHour +
        " horas para la libertad. Algún día, todos seremos libres."
    );
  }
});

bot.onText(/^\/chucknorris(@LesCoquitesBot)?/, msg => {
  request.get(apis.chuckNorris, (err, httpResponse, body) => {
    var joke = JSON.parse(body);
    bot.sendMessage(msg.chat.id, joke.value);
  });
});

bot.onText(/^\/sugerencia(@LesCoquitesBot)?/, msg => {
  var sugerencia = msg.text.split("/sugerencia ").pop();
  bot.sendMessage(
    msg.chat.id,
    "Tu sugerencia será elevada a quien corresponda, inútil"
  );
  bot.sendMessage(ids.iganre_id, sugerencia, { disable_notification: true });
});

bot.onText(/^\/random [\d]+-[\d]+$/, msg => {
  var numbers = msg.text
    .split("/random ")
    .pop()
    .split("-");

  var min = numbers[0];
  var max = numbers[1];

  if (min < max) {
    var randomNumber = Math.ceil(Math.random() * (max - min + 1) + min);
    bot.sendMessage(msg.chat.id, randomNumber);
  } else {
    bot.sendMessage(msg.chat.id, "Primero el min despues el max pelotudo.");
  }
});

bot.onText(/^\/dondecomemos(@LesCoquitesBot)?$/, msg => {
  var randomNumber = Math.floor(Math.random() * food.length);
  bot.sendMessage(msg.chat.id, "Hoy comemos en " + food[randomNumber] + "!");
});

//Agregar tareas por hacer
bot.onText(/^\/todo [a-zA-Z0-9_ ]*/, msg => {
  var text = msg.text.split("/todo ").pop();
  var todoListSaved;
  request.get(apis.todoList, function(err, httpResponse, body) {
    todoListSaved = JSON.parse(body);
    var newTodo = {};
    newTodo.text = text;
    newTodo.state = "☓";
    todoListSaved.push(newTodo);
    request(
      { url: apis.todoList, method: "PUT", json: todoListSaved },
      function(request, response) {
        bot.sendMessage(msg.chat.id, "TodoList Updated");
      }
    );
  });
});

//Consuntal lista de tareas
bot.onText(/^\/todolist/, msg => {
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body);
    if (todoList.length !== 0) {
      var todoListMostrable = todoList.map(a =>
        mostrarTareaEnLinea(a, todoList.indexOf(a))
      );
      todoListMostrable = todoListMostrable.join("\r\n");
      bot.sendMessage(msg.chat.id, todoListMostrable);
    } else {
      bot.sendMessage(msg.chat.id, "Todo list vacia");
    }
  });
});

//Mark todo list
bot.onText(/^\/checktodo [0-9]\d?\d?/, msg => {
  var idTodo = parseInt(msg.text.split("/checktodo ").pop());
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body);
    if (idTodo >= todoList.length) {
      bot.sendMessage(msg.chat.id, "No existe tarea.");
      return;
    }

    todoList[idTodo].state = "✓";
    request({ url: apis.todoList, method: "PUT", json: todoList }, function(
      request,
      response
    ) {
      bot.sendMessage(msg.chat.id, "OK: tarea id: " + idTodo);
    });
  });
});

//Reset todolist
bot.onText(/^\/resettodolist/, msg => {
  request({ url: apis.todoList, method: "PUT", json: [] }, function(
    request,
    response
  ) {
    bot.sendMessage(msg.chat.id, "Reset todo list");
  });
});

function mostrarTareaEnLinea(tarea, index) {
  return index + " | " + tarea.state + " | " + tarea.text;
}

bot.onText(/^\/cleanchecked(@LesCoquitesBot)?$/, msg => {
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body);
    todoList = todoList.filter(elem => elem.state === "☓");

    request({ url: apis.todoList, method: "PUT", json: todoList }, function() {
      bot.sendMessage(msg.chat.id, "Checked items borrados");
    });
  });
});

bot.onText(/^\/dolar(@LesCoquitesBot)?$/, msg => {
  var chatId = msg.chat.id;
  request.get(apis.nuevoDolar, function(err, httpResponse, body) {
    var dolar = JSON.parse(body);
    bot.sendMessage(
      chatId,
      "El dolar libre está $"
        .concat(dolar.items[0].compra).concat("/$").concat(dolar.items[0].venta)
        .concat(" y el blue $")
        .concat(dolar.items[3].compra).concat("/$").concat(dolar.items[3].venta)
    );
  });
});

bot.onText(/^\/cuandocomemos(@LesCoquitesBot)?$/, msg => {
  const chatId = msg.chat.id;
  var now = new Date().getHours();
  if (now === 15) {
    bot.sendMessage(
      chatId,
      "Qué hacés preguntando esto? Deberiás estar hincando el diente"
    );
  } else if (now === 16) {
    bot.sendMessage(
      chatId,
      "Más te vale ya haber comido, y estar ansioso por almorzar mañana"
    );
  } else if (now > 16) {
    bot.sendMessage(chatId, "Pará emoción, aguantá hasta mañana");
  } else if (now < 9) {
    bot.sendMessage(chatId, "Si tenés hambre comete una manzana");
  } else {
    if (14 - now > 0) {
      bot.sendMessage(
        chatId,
        "Comemos en "
          .concat(14 - now)
          .concat(":")
          .concat(60 - new Date().getMinutes())
          .concat("horas")
      );
    } else {
      bot.sendMessage(
        chatId,
        "Comemos en ".concat(60 - new Date().getMinutes()).concat(" minutos")
      );
    }
  }
});

bot.onText(/^\/unchecktodo [0-9]\d?\d?/, msg => {
  var idTodo = parseInt(msg.text.split("/unchecktodo ").pop());
  request.get(apis.todoList, function(err, httpResponse, body) {
    var todoList = JSON.parse(body);
    if (idTodo >= todoList.length) {
      bot.sendMessage(msg.chat.id, "No existe tarea.");
      return;
    }

    todoList[idTodo].state = "☓";
    request({ url: apis.todoList, method: "PUT", json: todoList }, function(
      request,
      response
    ) {
      bot.sendMessage(msg.chat.id, "Destildada tarea " + idTodo);
    });
  });
});

bot.onText(/^\/atr(@LesCoquitesBot)?$/, msg => {
  request.get(apis.atr, (err, response, body) => {
    var audios = JSON.parse(body);
    bot.sendAudio(
      msg.chat.id,
      audios[Math.floor(Math.random() * audios.length)]
    );
  });
});

/////////////////////////////////////SUBTE AUTOMATICO///////////////////////////////////
module.exports = {
  alertSubte: function(bodyParsed) {
    request.get(apis.subtePersistido, function(err, httpResponse, body) {
      if (showStatus(JSON.parse(body)) != showStatus(bodyParsed)) {
        request.get(apis.suscripcionSubte, function(
          err,
          httpResponse,
          bodySecond
        ) {
          listaChatId = JSON.parse(bodySecond);
          listaChatId.forEach(function(chatId) {
            bot.sendMessage(chatId, showStatus(bodyParsed));
          });
        });
      }
      request({ url: apis.subtePersistido, method: "PUT", json: bodyParsed });
    });
  }
};

bot.onText(/^\/subscribesubte(@LesCoquitesBot)?$/, msg => {
  chatId = msg.chat.id;
  request.get(apis.suscripcionSubte, function(err, httpResponse, body) {
    var lista = JSON.parse(body);
    if (lista.includes(chatId)) {
      bot.sendMessage(chatId, "Este chat ya está suscripto!");
    } else {
      lista.push(chatId);
      request({ url: apis.suscripcionSubte, method: "PUT", json: lista });
      bot.sendMessage(
        chatId,
        "Te suscribiste exitosamente a las notificaciones del subte"
      );
    }
  });
});

bot.onText(/^\/unsubscribesubte(@LesCoquitesBot)?$/, msg => {
  chatId = msg.chat.id;
  request.get(apis.suscripcionSubte, function(err, httpResponse, body) {
    var lista = JSON.parse(body);
    if (lista.includes(chatId)) {
      lista.splice(lista.indexOf(chatId), 1);
      bot.sendMessage(
        chatId,
        "Te borraste exitosamente de las notificaciones del subte"
      );
      request({ url: apis.suscripcionSubte, method: "PUT", json: lista });
    } else {
      bot.sendMessage(chatId, "Este chat no está suscripto!");
    }
  });
});

bot.onText(/buen(os)? d(í|i)a(s)?/i, msg => {
  bot.sendSticker(msg.chat.id, "CAADAQADCQADlVU3E--Nax_-949JAg");
});

bot.onText(/^\/weather(@LesCoquitesBot)?$/, msg => {
  request(
    { url: apis.weather + bsasKey, qs: { apikey: keys.weather } },
    (err, httpResponse, body) => {
      if (httpResponse.statusCode != 200) {
        bot.sendMessage(
          msg.chat.id,
          "There has been an error:\r\n" + JSON.parse(body).Message
        );
        return;
      }
      if (httpResponse.headers["content-encoding"] == "gzip") {
        zlib.gunzip(body, function(err, dezipped) {
          showWeather(msg.chat.id, JSON.parse(dezipped)[0]);
        });
      } else {
        showWeather(msg.chat.id, JSON.parse(body)[0]);
      }
    }
  );
});

function showWeather(chatId, weather) {
  bot.sendMessage(
    chatId,
    "Weather in Buenos Aires: " +
      weather.WeatherText +
      "\r\nTemperature: " +
      weather.Temperature.Metric.Value +
      "°"
  );
}

bot.onText(/qu(e|é) hacemos esta noche\??/i, msg => {
  if (
    new Date().setHours(0, 0, 0) >= new Date(after.getTime()).setHours(0, 0, 0)
  ) {
    var suffix = " (despues de agarrarnos un pedo bárbaro en el after)";
  } else {
    var suffix = "";
  }
  bot.sendMessage(
    msg.chat.id,
    "Lo mismo que hacemos todas las noches " +
      msg.from.first_name +
      ", tratar de conquistar al mundo!" +
      suffix
  );
});

bot.onText(/(facu)|(facultad)/i, msg => {
  switch (msg.from.first_name) {
    case "Nadia":
    case "Bianca":
      bot.sendMessage(
        msg.chat.id,
        "No jodas, vos ya terminaste la facultad " + msg.from.first_name
      );
      break;
    default:
      bot.sendMessage(
        msg.chat.id,
        "Deja la facultad de una vez " + msg.from.first_name
      );
  }
});

bot.onText(/^\/[Y|y]ou[T|t]ube [0-9a-zA-Zñáéíóúü ]*$/i, msg => {
  var q = msg.text.split("/youtube").pop();
  if (msg.from.username) {
    var displayName = msg.from.username;
  } else {
    var displayName = msg.from.first_name;
  }
  request.get(
    {
      url: apis.youtube,
      qs: { part: "id", q: q, key: keys.google, maxResults: 1 }
    },
    (err, res, body) => {
      if (res.statusCode == 403) {
        bot.sendMessage("Aflojenle un poco muchachos");
        return;
      }
      var videoId = JSON.parse(body).items[0].id.videoId;
      bot.deleteMessage(msg.chat.id, msg.message_id).catch(err => {});
      bot.sendMessage(
        msg.chat.id,
        "Aca tenes " +
          displayName +
          "\r\n" +
          "https://www.youtube.com/watch?v=" +
          videoId
      );
    }
  );
});

bot.onText(/^\/lucio(@LesCoquitesBot)?/, msg => {
  const chatId = msg.chat.id;
  var text = msg.text.split("/lucio ").pop();
  bot.sendMessage(chatId, text.toUpperCase());
});

bot.onText(/^\/chinito(@LesCoquitesBot)?/, msg => {
  const chatId = msg.chat.id;
  bot.sendSticker(chatId, "CAADAQADMQAD8Pe7Aj5g8hWbOkDRAg");
  if (msg.reply_to_message) {
    bot.sendMessage(chatId, achinosar(msg.reply_to_message.text))
  }else{
    var text = msg.text.split("/chinito ").pop();
    bot.sendMessage(chatId, achinosar(text));
  }
});

function achinosar(text) {
  return text.replace(/[a|á|ä|e|é|ë|o|ó|ö|u|ú|ü]/gi, "i");
}

bot.onText(/^\/papu/, msg => {
  bot.sendSticker(msg.chat.id, "CAADAQADjAAD_naARKO8xnUVfTJcAg");
});

bot.on("sticker", msg => {
  console.log("Sticker: " + msg.sticker.file_id);
});

bot.onText(/^\/killme(@LesCoquitesBot)?$/, msg => {
  bot.sendVideoNote(msg.chat.id, tobiIsSad);
});

var poroteo = new GoogleSpreadsheet(poroteoSheet);

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
bot.onText(/^\/poroteo(@LesCoquitesBot)?$/, msg => {
  poroteo.useServiceAccountAuth(caquita, googleToken => {
    // poroteo.setAuthToken(googleToken);
    poroteo.getCells(
      1,
      {
        "min-row": 14,
        "max-row": 14,
        "min-col": 4,
        "max-col": 7,
        "return-empty": true
      },
      (err, cells) => {
        if (err) {
          bot.sendMessage(
            msg.chat.id,
            "Error al acceder a la planilla, contactese con el administrador"
          );
          return;
        }
        var votes = {
          for: cells[0].value,
          against: cells[1].value,
          unconfirmed: cells[2].value,
          abstention: cells[3].value
        };
        bot.sendMessage(msg.chat.id, showVotes(votes));
      }
    );
  });
});

function showVotes(votes) {
  return "A favor: " +
    votes.for +
    "\nEn contra: " +
    votes.against +
    "\nIndeciso: " +
    votes.unconfirmed +
    "\nAbstencion: " +
    votes.abstention;
}

require("./schedule");

var caquita = {
  type: "service_account",
  project_id: "hincha-bolas-bot",
  private_key_id: "e2f647cb75217bc5b5c7490ee753972c30f06de6",
  private_key: keys.serviceKey,
  client_email: "bot-655@hincha-bolas-bot.iam.gserviceaccount.com",
  client_id: "105447702251730977405",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://accounts.google.com/o/oauth2/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/bot-655%40hincha-bolas-bot.iam.gserviceaccount.com"
};
