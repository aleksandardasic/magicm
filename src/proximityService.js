var gpio = require('rpi-gpio');

var lastUpdateTime = new Date().getTime();

var firstTime = true;

function getProximity(socket) {
  gpio.setup(18, gpio.DIR_IN, gpio.EDGE_FALLING);

  gpio.on('change', function (channel, value) {
    // console.log(`Proximity channel ${channel}, value ${value}`);

    if (value === PROXIMITY_FAR) {
      // console.log("Proximity is FAR, skipping.")
      return;
    }

    let currentTime = new Date().getTime();
    let timeDiff = currentTime - lastUpdateTime;

    // console.log("Time difference is: ", timeDiff);

    if (timeDiff < 5000 && !firstTime) {
      return;
    }

    firstTime = false;

    lastUpdateTime = currentTime;

    // console.log("Sending proximity...");
    socket.emit('proximity', value);
  });
}

module.exports.getProximity = getProximity;