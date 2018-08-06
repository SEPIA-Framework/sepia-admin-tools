//------ INTERFACE: ------

var sttServer = "";

function getSttServerUrl(){
	var host = $('#stt-server').val();
	if (host && !endsWith(host, "/"))	host += "/";
	return host;
}
function getSttServerToken(){
	return $('#stt-access-token').val();
}
function checkSttServer(_host){
	var host = _host || getSttServerUrl();
	if (!host){
		$('#stt-server-indicator').removeClass('secure'); 	//secure = connected (in this case)
		$('#stt-server-indicator').addClass('inactive');
		return;
	}
	httpRequest(host + "ping", function(data){
		//success
		showMessage('Success: STT-Server reached!');
		$('#stt-server-indicator').removeClass('inactive');
		$('#stt-server-indicator').addClass('secure');
		sessionStorage.setItem('sttServer', host);
		sttServer = host;
	}, function(){
		//error
		showMessage('Error: STT-Server could not be reached!');
		$('#stt-server-indicator').removeClass('secure');
		$('#stt-server-indicator').removeClass('inactive');
	}, "GET", "", "");
}
function checkSttServerKeyPress(){
	if (this.event.keyCode == 13) checkSttServer();
}

function setSttModel(){
	var newModel = $('#stt-model').val();
	if (!newModel){
		showMessage('Error: please set a valid model path!');
		return;
	}
	httpRequest(getSttServerUrl() + "settings", function(data){
		//SUCCESS
		showMessage(JSON.stringify(data, null, 2));
	}, function(err){
		//ERROR
		showMessage(JSON.stringify(err, null, 2));
	}, "POST", {
		"token": getSttServerToken(),
		"kaldi_model": newModel
	});
}
function getSttModel(){
	var host = getSttServerUrl();
	httpRequest(host + "settings", function(data){
		//success
		showMessage(JSON.stringify(data, null, 2));
		sessionStorage.setItem('sttServer', host);
		sttServer = host;
	}, function(err){
		//error
		showMessage(JSON.stringify(err, null, 2));
	}, "GET", "", "");
}

function sttAdaptLm(langTag){
	var newVersion = $('#stt-model-version').val();
	if (!newVersion){
		showMessage('Error: please set a version tag for the adapted new model!');
		return;
	}
	var dataBody = {};
		dataBody['token'] = getSttServerToken();
		dataBody[('adapt_' + langTag)] = newVersion;
	httpRequest(getSttServerUrl() + "settings", function(data){
		//SUCCESS
	}, function(err){
		//ERROR
	}, "POST", dataBody);
}