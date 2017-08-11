var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var temperatureService = require('./mocks/temperatureServiceMock');
var proximityService = require('./mocks/proximityServiceMock');
var calendarService = require('./calendarService');

let staticDir = `${__dirname}/static`

const TEMPERATURE_POLLING_MILIS = 10000;

app.use('/public', express.static(staticDir));

app.get('/', function (req, res) {
  res.sendFile(staticDir + '/index.html');
});

io.on('connection', function (socket) {
  temperatureService.getTemperature(socket);
  setInterval(temperatureService.getTemperature, TEMPERATURE_POLLING_MILIS, socket);
  proximityService.getProximity(socket);
  calendarService.getCalendar(socket);
});

server.listen(8080);