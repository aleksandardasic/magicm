var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sensor = require('node-dht-sensor');
var gpio = require('rpi-gpio');

app.use('/public', express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const TEMPERATURE_POLLING_MILIS = 10000;
const DHT_VERSION = 22;
const DHT_INPUT_PIN = 22;

const PROXIMITY_CLOSE = false;
const PROXIMITY_FAR = true;


class DHTState {
  constructor(temperature, humidity) {
    this.temperature = temperature;
    this.humidity = humidity;
  }
}

var dhtState = new DHTState(0, 0);

function getTemperature(socket) {
  sensor.read(DHT_VERSION, DHT_INPUT_PIN, function (err, temperature, humidity) {
    if (err) {
      console.log(`Reading DHT Sensor failed: ${err}`);
      return;
    }

    temperatureFixed = temperature.toFixed(2);
    humidityFixed = humidity.toFixed(2);

    console.log(`temperature: ${temperatureFixed} °C, humidity: ${humidityFixed} %`);

    let isSameTemperature = dhtState.temperature === temperatureFixed;
    let isSameHumidity = dhtState.humidity === humidityFixed;

    // if (isSameTemperature && isSameHumidity) {
    //   return;
    // }

    dhtState.temperature = temperatureFixed;
    dhtState.humidity = humidityFixed;

    socket.emit('dhtstate', dhtState);

    setInterval(getTemperature, TEMPERATURE_POLLING_MILIS, socket);
  });
}

var currentTime = process.hrtime();

function getProximity(socket) {
  gpio.setup(18, gpio.DIR_IN, gpio.EDGE_FALLING);

  gpio.on('change', function (channel, value) {
    console.log(`Proximity channel ${channel}, value ${value}`);

    if (value === PROXIMITY_FAR) {
      return;
    }

    let timeDiff = process.hrtime(currentTime)[0];

    currentTime = process.hrtime();

    if (timeDiff < 10) {
      return;
    }

    socket.emit('proximity', value);
  });
}

var fs = require('fs');
var calendarEvents = [];
var firstRun = true;
var future = [];

function getCalendar(socket) {
  getCalendarEntries(socket);
  // future = filterFutureEvents(calendarEvents);
  // console.log('Calendar events:', calendarEvents);
  // console.log('Future events: ', future);


  // socket.emit('calendar', future);
}

function filterFutureEvents(events) {
  let futureEvents = [];
  let now = new Date();
  let length = futureEvents.length;

  for (var i = 0; i < events.length; i++) {
    var date = Date.parse(events[i].date);
    if (date > now) {
      futureEvents.push(events[i]);
    }
  }

  futureEvents.sort(function (a, b) {
    return Date.parse(a.date) - Date.parse(b.date);
  });

  return futureEvents;
}

function getCalendarEntries(socket) {
  var input = fs.createReadStream('./mockedCalendar.txt');
  readLines(input, parseLine, socket);

  return calendarEvents;
}

function readLines(input, func, socket) {
  var remaining = '';

  calendarEvents = [];

  input.on('data', function (data) {
    remaining += data;
    var index = remaining.indexOf('\r\n');
    while (index > -1) {
      var line = remaining.substring(0, index);
      remaining = remaining.substring(index + 2);
      calendarEvents.push(func(line));
      index = remaining.indexOf('\r\n');
    }
  });

  input.on('end', function () {
    if (remaining.length > 0) {
      calendarEvents.push(func(remaining));
    }
    console.log("Calendar events: ", calendarEvents);
    let futureEvents = filterFutureEvents(calendarEvents);
    console.log("Future events: ", futureEvents);
    socket.emit('calendar', futureEvents);
  });
}

function parseLine(line) {
  var values = line.split(',');
  return {
    date: values[0],
    event: values[1]
  }
}

io.on('connection', function (socket) {
  getTemperature(socket);
  getProximity(socket);
  getCalendar(socket);
});

server.listen(8080);
