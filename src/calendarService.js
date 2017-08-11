var fs = require('fs');

var calendarEvents = [];
var future = [];

function getCalendar(socket) {
  getCalendarEntries(socket);
}

function filterFutureEvents(events) {
  let futureEvents = [];
  let now = new Date();
  let length = futureEvents.length;

  for (var i = 0; i < events.length; i++) {
    var date = Date.parse(events[i].date);
    if (date > now) {
      futureEvents.push(events[i]);
    }
  }

  futureEvents.sort(function (a, b) {
    return Date.parse(a.date) - Date.parse(b.date);
  });

  return futureEvents;
}

function getCalendarEntries(socket) {
  var input = fs.createReadStream('./mockedCalendar.txt');
  readLines(input, parseLine, socket);

  return calendarEvents;
}

function readLines(input, func, socket) {
  var remaining = '';

  calendarEvents = [];

  input.on('data', function (data) {
    remaining += data;
    var index = remaining.indexOf('\r\n');
    while (index > -1) {
      var line = remaining.substring(0, index);
      remaining = remaining.substring(index + 2);
      calendarEvents.push(func(line));
      index = remaining.indexOf('\r\n');
    }
  });

  input.on('end', function () {
    if (remaining.length > 0) {
      calendarEvents.push(func(remaining));
    }
    let futureEvents = filterFutureEvents(calendarEvents);
    socket.emit('calendar', futureEvents);
  });
}

function parseLine(line) {
  var values = line.split(',');
  return {
    date: values[0],
    event: values[1]
  }
}

module.exports.getCalendar = getCalendar;