let DB = require('nosql');

function getCalendar(socket) {
    let nosql = DB.load('./db/calendar.nosql');
    
    nosql.find().make(function (builder) {
        let now = new Date();

        // For now filter future events, needs to be changed for current week filter or one month
        builder.filter(doc => new Date(doc.date) > now);

        builder.callback(function (err, response) {
            console.log('Filtered calendar events: ', response);
            socket.emit('calendar', response);
        });
    });
}

module.exports.getCalendar = getCalendar;