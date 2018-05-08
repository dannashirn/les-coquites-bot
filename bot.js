'use strict';
var express = require('express');
var app = express();
var http = require('http').Server(app);
var request = require('request');

// var FCM = require('fcm-push');
var TelegramBot = require('node-telegram-bot-api');
var token = '530409477:AAFgBEhdgeRPwTRLpmlkikvZMOqjraecpIc';
var bot = new TelegramBot(token, {polling: true});
var feriadosApi = "http://nolaborables.com.ar/api/v2/feriados/2018";
var btcAPI = "https://api.coinmarketcap.com/v2/ticker/1";
var nasaAPI = "https://api.nasa.gov/planetary/apod?api_key=CyE7Qqsj6zAPenKJzDt6OIDulpFFTrGTunguMLn4";

app.get("/", function (req, res){
    res.send("OK");
});

bot.onText(/\/hi/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Hola " + msg.from.first_name);
});

bot.onText(/\/feriados/, (msg) => {
  var mesActual = new Date().getMonth()+1
  request.get(feriadosApi, function(err, httpResponse, body) {
    var feriados = JSON.parse(body);
    var feriadosDelMes = feriados.filter(f => f.mes === mesActual);
    var feriadosMostrables = feriadosDelMes.map(f => mostrarFeriadoEnLinea(f, mesActual));
    bot.sendMessage(msg.chat.id, feriadosMostrables.join("\r\n"));
  })
});

function mostrarFeriadoEnLinea(feriado, mesActual){
  return feriado.motivo + "("+ feriado.tipo +") "+ "dia: " + feriado.dia + "/" + mesActual;
}

bot.onText(/\/btc/, msg => {
  request.get(btcAPI, function(err, httpResponse, body) {
    var btc = JSON.parse(body)
    console.log(btc)
    bot.sendMessage(msg.chat.id, "$" + btc.data.quotes.USD.price)
  })
});

bot.onText(/\/nasa/, msg => {
  const chatId = msg.chat.id;
  request.get(nasaAPI, function(err, httpResponse, body) {
    var nasa = JSON.parse(body)
    console.log(nasa.url)
    bot.sendPhoto(chatId, nasa.hdurl)
    bot.sendMessage(chatId, nasa.explanation)
  })
});

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
