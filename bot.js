'use strict';
var express = require('express');
var app = express();
var http = require('http').Server(app);
var request = require('request');

// var FCM = require('fcm-push');
var TelegramBot = require('node-telegram-bot-api');
var keys = require('./config/keys')
var token = keys.token;
var apis = require('./config/apis')
var bot = new TelegramBot(token, {polling: true});

app.get("/", function (req, res){
    res.send("OK");
});

bot.onText(/\/hi/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Hola " + msg.from.first_name);
});

bot.onText(/\/feriados/, (msg) => {
  var mesActual = new Date().getMonth()+1
  request.get(apis.feriadosApi, function(err, httpResponse, body) {
    var feriados = JSON.parse(body);
    var feriadosDelMes = feriados.filter(f => f.mes === mesActual);
    var feriadosMostrables = feriadosDelMes.map(f => mostrarFeriadoEnLinea(f, mesActual));
    bot.sendMessage(msg.chat.id, feriadosMostrables.join("\r\n"));
  })
});

bot.onText(/\/proximoferiado/, msg => {
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

bot.onText(/\/btc/, msg => {
  request.get(apis.btcAPI, function(err, httpResponse, body) {
    var btc = JSON.parse(body)
    bot.sendMessage(msg.chat.id, "$" + btc.data.quotes.USD.price)
  })
});

bot.onText(/\/nasa/, msg => {
  const chatId = msg.chat.id;
  request.get(apis.nasaAPI, function(err, httpResponse, body) {
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

bot.onText(/\/celebrityQuote/, msg => {
  request.get(apis.quotesAPI, function(err,httpResponse,body){
    var phrase = JSON.parse(body)
    bot.sendMessage(msg.chat.id,"Frase: "+phrase.quote+"\r\n Autor: "+phrase.author)
  })
})