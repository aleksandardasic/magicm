var DB = require('nosql');
var nosql = DB.load('./db/calendar.nosql');


function getCalendar(socket) {
  nosql.find().make(function(builder) {
    var now = new Date();

    // For now filter future events, needs to be changed for current week filter or one month
    builder.filter(doc => new Date(doc.date) > now);

    builder.callback(function(err, response) {
        console.log('users between 20 and 30 years:', response);
        socket.emit('calendar', response);
    });
});
}

module.exports.getCalendar = getCalendar;