
const config = require('./config.json');
const request = require('request');
const fs = require('fs');

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
	        resolve(JSON.parse(body).access_token);
	    } 
		});	
	}); 
}

function requestHelper(url, method, json) {
	var func;
	var options = {url: url, auth: {'Content-Type': 'application/json'}};
	switch (method) {
		case 'GET':
			func = request.get;
			break;
		case 'PUT':
			func = request.put;
			options.body = json;
			options.json = true;
			break;
		case 'POST':
			func = request.post;
			options.body = json;
			options.json = true;
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

function searchVideosByTag(term, offset) {
	return requestHelper(`${config.base_url_cms}/videos?q=tags:${term}&limit=100&offset=${offset}`, 'GET');
}

function getIngestProfile(profile_id) {
	profile_id = profile_id ? `/${profile_id}` : '';
	return requestHelper(`${config.base_url_ingestion}/profiles${profile_id}`, 'GET');
}

function retranscodeVideo(video_id) {
	const body = {
    "master": { "use_archived_master": true },
    "profile": "videocloud-mkc_watermark",
    "callbacks": ["http://[2600:100f:b017:dc70:78f2:356b:5173:6160]/ingest-notifications"]
	}
	return requestHelper(`${config.base_url_dynamic_ingest}/${video_id}/ingest-requests`, 'POST', body);
}

var BrightcoveAPI = function () {

};

BrightcoveAPI.prototype = {
    
		searchVideosByTag: function(term, offset) {
			return searchVideosByTag(term, offset);
		},

		getIngestProfile: function(profile_id) {
			return getIngestProfile(profile_id);
		},

		retranscodeVideo: function(video_id) {
			return retranscodeVideo(video_id);
		}
    
}

module.exports = BrightcoveAPI;

