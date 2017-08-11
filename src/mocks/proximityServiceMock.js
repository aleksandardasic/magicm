const PROXIMITY_CLOSE = false;

function getProximity(socket) {
    socket.emit('proximity', PROXIMITY_CLOSE);
}

module.exports.getProximity = getProximity;
