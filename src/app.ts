import * as express from "express";
import * as http from "http";
import * as io from "socket.io"
import { TemperatureServiceMock } from '@src/services/mocks/temperatureServiceMock'
import { ProximityServiceMock } from './services/mocks/proximityServiceMock'
import { CalendarService } from './services/calendarService'

let app = express();
let server = new http.Server(app);
let ioServer = io(app);

let temperatureService = new TemperatureServiceMock();
let proximityService = new ProximityServiceMock();
let calendarService = new CalendarService();

let staticDir = `${__dirname}/static`

const TEMPERATURE_POLLING_MILIS = 10000;

app.use('/public', express.static(staticDir));

app.get('/', function (req, res) {
  res.sendFile(staticDir + '/index.html');
});

ioServer.on('connection', function (socket: SocketIO.Socket) {
  temperatureService.getTemperature(socket);
  setInterval(temperatureService.getTemperature, TEMPERATURE_POLLING_MILIS, socket);
  proximityService.getProximity(socket);
  calendarService.getCalendar(socket);
});

server.listen(8080);