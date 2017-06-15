var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sensor = require('node-dht-sensor');
var gpio = require('rpi-gpio');

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const TEMPERATURE_POLLING_MILIS = 1000;
const DHT_VERSION = 22;
const DHT_INPUT_PIN = 22;

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

    // setInterval(getTemperature, TEMPERATURE_POLLING_MILIS, socket);
  });
}

io.on('connection', function (socket) {
  getTemperature(socket);
});

server.listen(8080);
