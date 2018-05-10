'use strict';
var express = require('express');
var app = express();
var http = require('http').Server(app);
var request = require('request');
require("./schedule")

// var FCM = require('fcm-push');
var TelegramBot = require('node-telegram-bot-api');
var keys = require('./config/keys')
var token = keys.token;
var apis = require('./config/apis')
var bot = new TelegramBot(token, {polling: true});

app.get("/", function (req, res){
    res.send("OK");
});

bot.onText(/^\/hi$/, (msg) => {
  const chatId = msg.chat.id;
  if( msg.from.first_name === 'Tobias' || msg.from.first_name === 'Ignacio Javier'){
    bot.sendMessage(chatId, "No me rompas las bolas " + msg.from.first_name + " sos un pesado.");
  } else{
    bot.sendMessage(chatId, "Hola " + msg.from.first_name);
  }
  
});

bot.onText(/^\/null$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Null");
});

bot.onText(/^\/feriados$/, (msg) => {
  var mesActual = new Date().getMonth()+1
  request.get(apis.feriadosApi, function(err, httpResponse, body) {    
    var feriados = JSON.parse(body);
    var feriadosDelMes = feriados.filter(f => f.mes === mesActual);
    var feriadosMostrables = feriadosDelMes.map(f => mostrarFeriadoEnLinea(f, mesActual));
    bot.sendMessage(msg.chat.id, feriadosMostrables.join("\r\n"));
  })
});

bot.onText(/^\/proximoferiado$/, msg => {
  var mesActual = new Date().getMonth() + 1;
  request.get(apis.feriadosApi, function(err, httpResponse, body) {
    var feriados = JSON.parse(body);
    var feriado = proximoFeriado(feriados);
    var feriadoMostrable = mostrarFeriadoEnLinea(feriado, mesActual);
    var diasRestantes = diasHastaFeriado(feriado);
    bot.sendMessage(
      msg.chat.id,
      "Faltan " + diasRestantes + " dias para el proximo feriado\r\n" + feriadoMostrable
    );
  });
});

function proximoFeriado(feriados) {
  var today = new Date();
  return feriados.filter(
    f => f.mes >= today.getMonth() + 1 && f.dia >= today.getDate()
  )[0];
}

function diasHastaFeriado(feriado) {
  var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  var firstDate = new Date();
  var secondDate = new Date(
    new Date().getFullYear(),
    feriado.mes - 1,
    feriado.dia
  );

  return Math.ceil(
    Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)
  );
}

function mostrarFeriadoEnLinea(feriado, mesActual){
  return feriado.motivo + "("+ feriado.tipo +") "+ "dia: " + feriado.dia + "/" + mesActual;
}

bot.onText(/^\/btc$/, msg => {
  request.get(apis.btcAPI, function(err, httpResponse, body) {
    var btc = JSON.parse(body)
    bot.sendMessage(msg.chat.id, "$" + btc.data.quotes.USD.price)
  })
});

bot.onText(/^\/nasa$/, msg => {
  const chatId = msg.chat.id;
  request.get(apis.nasaAPI, function(err, httpResponse, body) {
    var nasa = JSON.parse(body)
    bot.sendPhoto(chatId, nasa.hdurl)
  })
});

bot.onText(/^\/nasaText$/, msg => {
  const chatId = msg.chat.id;
  request.get(apis.nasaAPI, function(err, httpResponse, body) {
    var nasa = JSON.parse(body)
    bot.sendMessage(chatId, nasa.explanation)
  })
});

bot.onText(/^\/subte$/, msg => {
  request.get(apis.haySubte, function(err, httpResponse, body) {
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

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//
//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, 'Received your message');
// });

bot.on('new_chat_participant', function (msg) {
    bot.sendMessage(chatId, "Bienvenido " + msg.from.first_name);
});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('listening on *:' +port);
});

bot.onText(/^\/celebrityquotes$/, msg => {
  request.get(apis.quotesAPI, function(err,httpResponse,body){
    var phrase = JSON.parse(body)
    bot.sendMessage(msg.chat.id,"Frase: "+phrase.quote+"\r\n Autor: "+phrase.author)
  })
})

bot.onText(/^\/juevesdecubalibre$/, msg => {
  var days = Math.abs(new Date().getDay() - 4);
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
      return "Faltan" + days + "dias para el jueves de cuba libre :(";
  }
}

bot.onText(/^\/pokemon [1-9]\d?\d?/, msg => {
  const chatId = msg.chat.id;
  var pokemon_number = (msg.text.split("/pokemon ").pop());  
  console.log(apis.pokedex.concat(pokemon_number))
  request.get(apis.pokedex.concat(pokemon_number), function(err, httpResponse, body){    
   if(httpResponse.statusCode == 200){
      var pokemon = JSON.parse(body);
      bot.sendPhoto(chatId, pokemon.sprites.front_default)
      bot.sendMessage(chatId, pokemon.name)
    }else if(httpResponse.statusCode == 504) {
      bot.sendMessage(chatId, "En estos momentos todos nuestros operadores se encuentran ocupados. Intente nuevamente mas tarde.")
    }else {
      bot.sendMessage(chatId, "Envia un numero de pokemon valido")
    }
 })
})


bot.onText(/^\/proximoafter$/, msg => {
  const chatId = msg.chat.id;
  var after = new Date(2018, 4, 24, 20, 30, 0, 0);
  var today = new Date();
  var oneDay = 24 * 60 * 60 * 1000;
  if(after > today){
    if((after - today)/oneDay < 1){
      bot.sendMessage(chatId, "Hoy es el after! Un poco de luz entre tanta miseria y oscuridad")
    }else if((after - today)/oneDay < 2){
      bot.sendMessage(chatId, "El after en Madero es mañana")
    }else{
      bot.sendMessage(chatId, "Faltan ".concat(Math.floor((after - today)/oneDay) + 1).concat(" dias para el proximo after en Madero"));
    }
  }else{
    bot.sendMessage(chatId, "El after ya paso, pero como siguen resacosos, no me cargaron cuando es el proximo")
  }
  
})


bot.onText(/^\/libertad$/, msg => {
  var timeTil6 = new Date(msg.date) - new Date()
})
