//send server config request to assist API
function serverConfigRequest(requestBody, successCallback, errorCallback){
	if (!successCallback) successCallback = function(data){
		showMessage(JSON.stringify(data, null, 2));
	}
	if (!errorCallback) errorCallback = function(data){
		showMessage(JSON.stringify(data, null, 2));
	}
	genericFormPostRequest("assist", "config", requestBody, successCallback, errorCallback);
}

function softRestartServer(){
	var body = {
		restartServer: true
	}
	serverConfigRequest(body);
}

function getAdHocServerConfig(){
	serverConfigRequest({});
}
function getFullServerConfig(){
	var body = {
		getConfig: "all"
	}
	serverConfigRequest(body);
}
function getSpecificServerConfig(key, successCallback, errorCallback){
	if (!key) key = $('#settings-write-kvpair-k').val();
	var body = {
		getConfig: key
	}
	serverConfigRequest(body, successCallback, errorCallback);
}
function writeKeyValueToServerConfig(){
	var k = $('#settings-write-kvpair-k').val();
	var v = $('#settings-write-kvpair-v').val();
	if (k && v != undefined){
		var d = {};
		d[k] = v;
		var body = {
			"setConfig": JSON.stringify(d)
		};
		serverConfigRequest(body);
	}
}
function toggleServerAnswers(){
	var body = {
		"answers" : "toggle"
	}
	serverConfigRequest(body);
}
function toggleSdk(){
	var body = {
		"sdk" : "toggle"
	}
	serverConfigRequest(body);
}
function toggleSentencesDb(){
	var body = {
		"useSentencesDB" : "toggle"
	}
	serverConfigRequest(body);
}
function cleanEmailBcc(){
		var body = {
		"setEmailBCC" : "remove"
	}
	serverConfigRequest(body);
}
function reloadDatabaseIndex(){
	var dbReloadCmd = $('#settings-db-reload').val();
	var body = {
		"reloadDB" : dbReloadCmd
	}
	serverConfigRequest(body);
}

//-------- SDK ---------

//Get services upload form
function getServicesUpload(){
	var link = getServer("assist") + "upload-service";
	genericGetRequest(link, function(data){
		showMessage(data, true);
		//change post action to correct server
		$('#upload-service-box').find('form').attr('action', link);
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}