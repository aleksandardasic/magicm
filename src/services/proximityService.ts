let gpio = require('rpi-gpio');

const PROXIMITY_CLOSE = false;
const PROXIMITY_FAR = true;

export class ProximityService {

  lastUpdateTime = new Date().getTime();

  firstTime: boolean = true;

  getProximity(socket: SocketIO.Socket): void {
    gpio.setup(18, gpio.DIR_IN, gpio.EDGE_FALLING);

    gpio.on('change', function (channel, value) {
      // console.log(`Proximity channel ${channel}, value ${value}`);

      if (value === PROXIMITY_FAR) {
        // console.log("Proximity is FAR, skipping.")
        return;
      }

      let currentTime = new Date().getTime();
      let timeDiff = currentTime - this.lastUpdateTime;

      // console.log("Time difference is: ", timeDiff);

      if (timeDiff < 5000 && !this.firstTime) {
        return;
      }

      this.firstTime = false;

      this.lastUpdateTime = currentTime;

      // console.log("Sending proximity...");
      socket.emit('proximity', value);
    });
  }
}