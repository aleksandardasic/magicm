var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sensor = require('node-dht-sensor');
var gpio = require('rpi-gpio');

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const TEMPERATURE_POLLING_MILIS = 20000;
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

    if (isSameTemperature && isSameHumidity) {
      return;
    }

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

function getCalendar(socket) {
  getCalendarEntries();
  let futureEvents = filterFutureEvents(calendarEvents);

  socket.emit('calendar', futureEvents);
}

function filterFutureEvents(calendarEvents) {
  var futureEvents = [];
  var now = new Date();
  var length = calendarEvents.length;

  for (var i = 0; i < length; i++) {
    var date = Date.parse(calendarEvents[i].date);
    if (date > now) {
      futureEvents.push(calendarEvents[i]);
    }
  }

  futureEvents.sort(function (a, b) {
    return Date.parse(a.date) - Date.parse(b.date);
  });

  return futureEvents;
}

function getCalendarEntries() {
  var input = fs.createReadStream('./mockedCalendar.txt');
  readLines(input, parseLine);

  return calendarEvents;
}

function readLines(input, func) {
  var remaining = '';

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
