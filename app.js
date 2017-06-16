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
// var proximityState = PROXIMITY_FAR;
// var proximityLastUpdate = process.hrtime();


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

// var firstTime = true;


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

    // if (!firstTime) {
    //   let proximityTimeDifference = process.hrtime(proximityLastUpdate);
    //   // console.log(`Proximity time difference ${proximityTimeDifference}`);

    //   let proximityTimeDifferenceSeconds = proximityTimeDifference[0];

    //   if (proximityTimeDifferenceSeconds === 0) {
    //     // console.log(`Proximity time difference is ZERO.`);
    //     value = PROXIMITY_CLOSE;
    //   }
    // }
    // firstTime = false;

    // proximityLastUpdate = process.hrtime();

    // if (proximityState === value) {
    //   return;
    // }

    // proximityState = value;

    // console.log(value);
    // socket.emit('proximity', proximityState);


    // if (value === PROXIMITY_FAR && proximityTimeDifference > 4) {
    //   console.log(`Proximity time difference: ${proximityTimeDifference}`);
    //   socket.emit('proximity', value);
    //   proximityState = value;
    //   proximityLastUpdate = process.hrtime();

    // } else {

    //   // if (value === PROXIMITY_CLOSE) {
    //   //   proximityLastUpdate = process.hrtime();
    //   // }


    //   if (proximityState === value) {
    //     return;
    //   }

    //   proximityState = value;

    //   socket.emit('proximity', proximityState);
    // }

  });

}

io.on('connection', function (socket) {
  getTemperature(socket);
  getProximity(socket);
});

server.listen(8080);
