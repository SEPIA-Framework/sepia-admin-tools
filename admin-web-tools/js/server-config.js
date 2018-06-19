//send server config request to assist API
function serverConfigRequest(requestBody){
	genericFormPostRequest("assist", "config", requestBody, function(data){
		showMessage(JSON.stringify(data, null, 2));
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

function getServerConfig(){
	serverConfigRequest({});
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