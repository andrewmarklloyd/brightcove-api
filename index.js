

const config = require('./config.json');
const request = require('request');
const fs = require('fs');

const bearerInfo = {
		auth: {
			bearer: JSON.parse(fs.readFileSync('auth_token.json')).access_token,
			'Content-Type': 'application/json'
		}
};

function requestNewAuthToken() {
	const auth_string = new Buffer(config.client_id + ":" + config.client_secret).toString('base64');
	const options = {
		method: 'POST',
		url: 'https://oauth.brightcove.com/v3/access_token',
		headers: {
			'Authorization': 'Basic ' + auth_string,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials'
	};

	return new Promise(function(resolve, reject){
		request(options, function(err, resp, body) {
	    if (err) {
	        reject(err);
	    } else {
	        fs.writeFileSync('auth_token.json', body);
	        resolve(JSON.parse(body).access_token);
	    } 
		});	
	});
}

function requestHelper(url, method, json) {
	var func;
	var options;
	switch (method) {
		case 'GET':
			func = request.get;
			options = {url: url, auth: bearerInfo.auth};
			break;
		case 'PUT':
			func = request.put;
			options = {url: url, auth: bearerInfo.auth, body: json, json: true};
			break;
		case 'POST':
			func = request.post;
			options = {url: url, auth: bearerInfo.auth, body: json, json: true};
			break;
	}
	const promise = new Promise((resolve, reject) => {
		requestNewAuthToken().then(auth_token => {
				return auth_token;
		}).then(function(auth_token){
			options.auth.bearer = auth_token;
			func(options, function(err, resp, body) {
		  	if (err) {
		    	reject(err);
			  } else {
			  	resolve(body);
			  } 
			});
		});
	});
	return promise;
}

function searchVideosByTag(term, offset, callback) {
	requestHelper(`${config.base_url_cms}/videos?q=tags:${term}&limit=100&offset=${offset}`, 'GET')
		.then(body => {
			console.log(body);
		});
}

function getIngestProfile(profile_id) {
	profile_id = profile_id ? `/${profile_id}` : '';
	requestHelper(`${config.base_url_ingestion}/profiles${profile_id}`, 'GET')
		.then(body => {
			console.log(JSON.stringify(body, null, 2));
		});
}

function retranscodeVideo(video_id) {
	const body = {
    "master": { "use_archived_master": true },
    "profile": "videocloud-mkc_watermark"
	}
	requestHelper(`${config.base_url_dynamic_ingest}/${video_id}/ingest-requests`, 'POST', body)
		.then(body => {
			console.log(JSON.stringify(body, null, 2));
		});
}

/*
http://docs.brightcove.com/en/video-cloud/di-api/getting-started/quick-start-di.html
A 20 request per minute limit on each account for total requests across DI and the CMS API (CMS API or Ingest API requests)
A limit of 100 concurrent DI jobs per account
If you are ingesting files in batches, limit batches to 100 and wait for the previous batch to complete processing before continuing
*/
/////////////////////////////////////////// END FUNCTIONS ///////////////////////////////////////////



function getMkcVideosHelper() {
	const data = require('./mkc.json');
	searchVideosByTag('mkc', 0, function(videos){
			videos.forEach(function(item){
				data.push(item);
			});
			console.log(data);
			//fs.writeFileSync('mkc.json', JSON.stringify(data, null, 2));
			//console.log(require('./mkc.json').length);
		});
}

//getIngestProfile('59247af2e4b01c765233b9a7');//, require('./profile.json'));
//retranscodeVideo('5227368064001');







