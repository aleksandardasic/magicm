const PROXIMITY_CLOSE = false;

export class ProximityServiceMock {
    getProximity(socket) {
        socket.emit('proximity', PROXIMITY_CLOSE);
    }
}