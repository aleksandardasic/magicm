import { DHTState } from "./../../dtos/dhtstate"

export class TemperatureServiceMock {
    getTemperature(socket) {
        let dhtState = new DHTState(27.3, 45);
        socket.emit('dhtstate', dhtState);
    }
}
