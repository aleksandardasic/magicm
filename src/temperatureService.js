var sensor = require('node-dht-sensor');


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

    let temperatureFixed = temperature.toFixed(2);
    let humidityFixed = humidity.toFixed(2);

    console.log(`temperature: ${temperatureFixed} °C, humidity: ${humidityFixed} %`);

    let isSameTemperature = dhtState.temperature === temperatureFixed;
    let isSameHumidity = dhtState.humidity === humidityFixed;

    if (isSameTemperature && isSameHumidity) {
      return;
    }

    dhtState.temperature = temperatureFixed;
    dhtState.humidity = humidityFixed;

    socket.emit('dhtstate', dhtState);
  });
}

module.exports.getTemperature = getTemperature;