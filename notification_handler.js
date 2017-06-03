const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const fs = require('fs')
const LogInterface = require('./log_if')
const log_if = new LogInterface()
const UUID = require('./uuid');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.listen(port);
console.log('Server started! At http://localhost:' + port);

// setup logging
log_if.initialize('logs/notification_handler.json')

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
  	notifyListeners(jobId)

  	// log the error message 
  	if (status === 'FAILED' || status !== 'SUCCESS') {
  		if (errorMessage) {
  			log_if.logErrorMessage({date: new Date(), videoId: videoId, jobId: jobId, errorMessage: errorMessage})
  		}
  	}
  }
});

function notifyListeners(jobId) {
	jobFinishedListeners.forEach(listener => {
  	listener(jobId)
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
			if (index > -1) {jobFinishedListeners.splice(index, 1)}
		},

		MOCK_retranscodeVideo: function(callback) {
			MOCK_retranscodeVideo(callback)
		}
    
}

module.exports = NotificationServer

MOCK_jobsList = []

function MOCK_retranscodeVideo(callback) {
	setTimeout(callback => {
		var uuid = UUID.generateUUID()
		MOCK_jobsList.push(uuid)
		callback({id: uuid})
	}, 4000, callback)	
}


setInterval(()=>{
	notifyListeners(MOCK_jobsList.pop())
}, 5000)







