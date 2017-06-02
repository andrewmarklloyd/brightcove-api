const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const fs = require('fs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.listen(port);
console.log('Server started! At http://localhost:' + port);

// setup logging
if (!fs.existsSync('log.json')) { 
  fs.writeFileSync('log.json', '[]')
}

const jobFinishedListeners = []


app.post('/api/ingest-notification', function(req, res) {
	// Send the response immediately
	res.status(200).send({message: 'Notification received'})

	//check for transcoding finished notifications only
  if (req.body.entityType && req.body.entityType === 'TITLE') {
  	const jobId = req.body.jobId
  	const videoId = req.body.videoId
  	const action = req.body.action
  	const status = req.body.status
  	const errorMessage = req.body.errorMessage

  	// notify listeners of finished job
  	jobFinishedListeners.forEach(listener => {
  		listener(jobId)
  	})

  	// log the error message 
  	if (status === 'FAILED' || status !== 'SUCCESS') {
  		if (errorMessage) {
  			logErrorMessage({date: new Date(), videoId: videoId, errorMessage: errorMessage})
  		}
  	}
  }
});

function logErrorMessage(message) {
	fs.readFile('log.json', (err, data) => {
		if (err) {throw err}
    var json = JSON.parse(data)
    json.push(message)
    fs.writeFile("log.json", JSON.stringify(json), err => {
    	if (err) {throw err};
    })
	})
}

var NotificationServer = function () {

};

NotificationServer.prototype = {
    
		addJobFinishedListener: function(listener) {
			jobFinishedListeners.push(listener)
		},

		removeJobFinishedListener: function(listener) {
			const index = jobFinishedListeners.indexOf(listener)
			if (index > -1) {jobFinishedListeners.splice(index, 1)};
		},
    
}

module.exports = NotificationServer;










