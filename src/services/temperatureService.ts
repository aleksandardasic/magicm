var sensor = require('node-dht-sensor');
import { DHTState } from "./../dtos/dhtstate"

const DHT_VERSION = 22;
const DHT_INPUT_PIN = 22;

export class TemperatureService {
  dhtState = new DHTState(0, 0);
  
  getTemperature(socket: SocketIO.Socket) {
    sensor.read(DHT_VERSION, DHT_INPUT_PIN, function (err, temperature, humidity) {
      if (err) {
        console.log(`Reading DHT Sensor failed: ${err}`);
        return;
      }
  
      let temperatureFixed = temperature.toFixed(2);
      let humidityFixed = humidity.toFixed(2);
  
      console.log(`temperature: ${temperatureFixed} °C, humidity: ${humidityFixed} %`);
  
      let isSameTemperature = this.dhtState.temperature === temperatureFixed;
      let isSameHumidity = this.dhtState.humidity === humidityFixed;
  
      if (isSameTemperature && isSameHumidity) {
        return;
      }
  
      this.dhtState.temperature = temperatureFixed;
      this.dhtState.humidity = humidityFixed;
  
      socket.emit('dhtstate', this.dhtState);
    });
  }
}