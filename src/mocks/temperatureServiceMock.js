var DHTState = require('../dhtstate')

function getTemperature(socket) {
    dhtState = new DHTState(27.3, 45);
    socket.emit('dhtstate', dhtState);
}

module.exports.getTemperature = getTemperature;