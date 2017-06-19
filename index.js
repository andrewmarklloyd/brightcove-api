const BrightcoveAPI = require('./brightcove_api')
const brightcove = new BrightcoveAPI()
const NotificationHandler = require('./notification_handler')
const notification_handler = new NotificationHandler()
const Queue = require('blocking-queue').default
const QueueConsumer = require('blocking-queue').QueueConsumer
const queue = new Queue()
const consumer = new QueueConsumer(queue)
const fs = require('fs')
const LogInterface = require('./log_if')
const log_if = new LogInterface()
log_if.initialize('logs/processor.json')

var TASK_INTERVAL

const runningJobs = []
const jobList = require('./id_mkc.json')

const MAX_RUNNING_JOBS = 100
const RATE_LIMIT = 3000;


function initializeConsumer() {
	consumer.start(task => {
		return defineConsumerJob(task)
	}, 1)
}

function addConsumerTask() {
	const job = jobList.pop()
	if (job) {
		runningJobs.push({videoId: job, jobId: null})
		queue.push(job)
	} else {
		if (runningJobs.length === 0) {
			console.log()
			console.log('******* All processing done *******')
			clearInterval(TASK_INTERVAL)
			console.log('runningJobs:', runningJobs)
			console.log('jobList:', jobList)
			process.exit()	
		}
	}
}

function defineConsumerJob(videoId) {
	return new Promise((resolve, reject) => {
			brightcove.retranscodeVideo(videoId, 'videocloud-mkc_watermark', ["http://71.197.135.41:3000/api/ingest-notification"]).then(jobId => {
				var index = runningJobs.map(function(e) { return e.videoId; }).indexOf(videoId)
				if (index > -1) {
					runningJobs[index].jobId = jobId.id
				} else {
					console.log('UNKNOWN JOB, or job was completed before it began?')
				}
				resolve()
			}).catch(err => {
				console.log(err)
				log_if.logErrorMessage({date: new Date(), errorMessage: err})
				reject(err)
			})
			resolve()
		})
}

function testConsumerJob(videoId) {
	return new Promise((resolve, reject) => {
			notification_handler.MOCK_retranscodeVideo(function(jobId) {
				var index = runningJobs.map(function(e) { return e.videoId; }).indexOf(videoId)
				if (index > -1) {
					runningJobs[index].jobId = jobId.id
				} else {
					console.log('UNKNOWN JOB, or job was completed before it began?')
				}
				resolve()
			})
		})
}

function initializeJobFinishedListener() {
	notification_handler.addJobFinishedListener(jobId => {
		var index = runningJobs.map(function(e) { return e.jobId; }).indexOf(jobId)
		if (index > -1) {
			console.log('Job', jobId, 'finished')
			runningJobs.splice(index, 1)
		} else {
			console.log('RECEIVED NOTIFICATION OF UNKNOWN JOB', jobId)
			log_if.logErrorMessage({date: new Date(), jobId: jobId, errorMessage: 'RECEIVED NOTIFICATION OF UNKNOWN JOB'})
		}
	})
}


function controller() {
	TASK_INTERVAL = setInterval(() => {
		console.log('Tasks remaining:', jobList.length)
		console.log('Running jobs:', runningJobs.length)
		if (runningJobs.length < MAX_RUNNING_JOBS) {
			addConsumerTask()
		} else {
			console.log()
		}
	}, RATE_LIMIT)
}

initializeConsumer()
initializeJobFinishedListener()	
controller()




