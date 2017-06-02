const fs = require('fs')

var LOGFILE;


function initialize(filename) {
	LOGFILE = filename
	if (!fs.existsSync(LOGFILE)) { 
  	fs.writeFileSync(LOGFILE, '[]')
	}	
}


function logErrorMessage(message) {
	fs.readFile(LOGFILE, (err, data) => {
		if (err) {throw err}
    var json = JSON.parse(data)
    json.push(message)
    fs.writeFile(LOGFILE, JSON.stringify(json), err => {
    	if (err) {throw err};
    })
	})
}

var LogInterface = function () {}

LogInterface.prototype = {
		initialize: function(filename) {
			initialize(filename)
		},
		logErrorMessage: function(message) {
			logErrorMessage(message)
		}
}

module.exports = LogInterface