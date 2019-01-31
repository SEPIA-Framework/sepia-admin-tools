//TODO: we should fix this at some point and make it local not global

//some config stuff
var client_info = "web_app_tools";
var user_name = "Boss";
var userid = "";
var key = "";
var environment = "web_app";
var is_html_app = false;

//get credentials for server access
function login(successCallback){
	//call login or restore data
	var login = (window.ByteMind && ByteMind.account)? ByteMind.account.getData() : "";
	//transfer parameters
	if (login){
		language = login.language;
		userid = login.userId;
		key = login.userToken;
		user_name = login.userName || "Boss";
		//possible overwrite
		//client_info = ByteMind.config.clientInfo;
		//environment = login.environment;
		//is_html_app = login.is_html_app;

		//note: not used but I'll just leave it active
		$('#login-info-box-id').html(user_name + " (" + userid + ")");
		$('#login-info-box-host').html(login.url);
		$('#login-info-box-client').html(client_info);
		
		if (successCallback) successCallback(login);
	}
	return '';
}
function toggleLoginInfoBox(){
	$('#login-info-box').toggle();
}
function showCookieLS(){
	console.log('all cookies: ' + document.cookie);
	/*
	var cook = 'sepia_auth_' + client_info;
	console.log('localStorage: ' + localStorage.getItem(cook));
	console.log('sessionStorage: ' + sessionStorage.getItem(cook));
	*/
}

//get parameter from URL
function getURLParameter(name) {
	if (window.ByteMind){
		return ByteMind.page.getURLParameter(name);
	}else{
		return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
	}
}
//get local date in required format
function getLocalDateTime(){
	var d = new Date();
	var HH = addZero(d.getHours());
	var mm = addZero(d.getMinutes());
	var ss = addZero(d.getSeconds());
	var dd = addZero(d.getDate());
	var MM = addZero(d.getMonth() + 1);
	var yyyy = d.getFullYear();
	return '' + yyyy + '.' + MM + '.' + dd + '_' + HH + ':' + mm + ':' + ss;
}
function addZero(i) {
	return (i < 10)? "0" + i : i;
}
//sha256 hash + salt
function getSHA256(data){
	return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(data + "salty1"));
}

//escape html specific characters to show code in results view
function escapeHtml(codeString){
    return codeString.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

//CONTROLS AND SETTINGS

function exit(){
	//TODO: delete all tokens etc.
}

function showMessage(msg, skipCodeEscape){
	if (!skipCodeEscape) msg = escapeHtml(msg);
	var showEle = document.getElementById('show_result');
	if (showEle){
		showEle.innerHTML = 
			"<div style='display:inline-block; white-space: pre; text-align: left;'>"
				+ msg +
			"</div>";
		$('#result-container').show();
	}
}
function closeMessage(){
	$('#result-container').hide();
}

function getClient(){
	var customClient = $('#custom-client').val();
	if (customClient){
		sessionStorage.setItem('customClient', customClient);
		return customClient;
	}else{
		return client_info;
	}
}
function getKey(){
	var id = $('#id').val();
	var pwd = $('#pwd').val();
	updatePasswordSecurityWarning(pwd);
	if (id && pwd){
		sessionStorage.setItem('id', id);
		sessionStorage.setItem('pwd', pwd);
		if (pwd.length < 60){
			return (id + ";" + getSHA256(pwd));
		}else{
			return (id + ";" + pwd);
		}
	}else{
		return key;
	}
}
function updatePasswordSecurityWarning(_pwd){
	var pwd = _pwd || $('#pwd').val();
	if (!pwd){
		$('#pwd-security-indicator').removeClass('secure');
		$('#pwd-security-indicator').addClass('inactive');
		return;
	}
	if (pwd.length != 65){
		//simple hash - not secure
		$('#pwd-security-indicator').removeClass('secure');
		$('#pwd-security-indicator').removeClass('inactive');
	}else{
		//token - secure if user does logout
		$('#pwd-security-indicator').removeClass('inactive');
		$('#pwd-security-indicator').addClass('secure');
	}
}

function onChangeMainServer(){
	var custom = $('#server').val();
	if (custom){
		sessionStorage.setItem('customServer', custom);
	}else{
		sessionStorage.setItem('customServer', "");
		/* select button is inactive
		sessionStorage.setItem('server', server_select.value);
		url = server_select.options[server_select.selectedIndex].value;
		*/
	}
	updateHostServer(custom);
}
function onChangeAssistServer(){
	var server = $('#assist-server').val();
	if (server){
		sessionStorage.setItem('assistServer', server);
	}else{
		sessionStorage.setItem('assistServer', "");
	}
}
function onChangeTeachServer(){
	var server = $('#teach-server').val();
	if (server){
		sessionStorage.setItem('teachServer', server);
	}else{
		sessionStorage.setItem('teachServer', "");
	}
}
function onChangeChatServer(){
	var server = $('#chat-server').val();
	if (server){
		sessionStorage.setItem('chatServer', server);
	}else{
		sessionStorage.setItem('chatServer', "");
	}
}
function onChangeMeshNodeServer(){
	var server = $('#mesh-node-server').val();
	if (server){
		sessionStorage.setItem('meshNodeServer', server);
	}else{
		sessionStorage.setItem('meshNodeServer', "");
	}
}
function searchLocalServers(){
	alert('UNDER CONSTRUCTION');
}
function getServer(apiName){
	var url = "";
	if (apiName){
		if (apiName == "assist"){
			url = $('#assist-server').val() || $('#assist-server').attr('placeholder');
		}else if (apiName == "teach"){
			url = $('#teach-server').val() || $('#teach-server').attr('placeholder');
		}else if (apiName == "chat"){
			url = $('#chat-server').val() || $('#chat-server').attr('placeholder');
		}else if (apiName == "mesh-node"){
			url = $('#mesh-node-server').val() || $('#mesh-node-server').attr('placeholder');		
		}else{
			url = $('#server').val() || $('#server').attr('placeholder');
		}
	}else{
		url = $('#server').val() || $('#server').attr('placeholder');
	}
	//core server apis
	if (!endsWith(url, "/")){
		url += "/";
	}
	if (endsWith(url, "/sepia/")){
		if (apiName){
			url += (apiName + "/");
		}else{
			url += "assist/";
			console.error("API URL is incomplete, best guess: " + url);
			/*alert("API URL is incomplete: " + url + "\n" + "Please choose a different server for this operation.");*/
		}
	}
	return url;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function buildLanguageSelectorOptions(){
	var html = '' 
			+ '<!-- officially supported -->'
			+ '<option value="de">German</option>	<option value="en">English</option>'
			+ '<!-- basic supported, no content -->'
			+ '<option value="es">Spanish</option>	<option value="fr">French</option>'
			+ '<option value="tr">Turkish</option>	<option value="sv">Swedish</option>'
			+ '<option value="ar">Arabic</option>	<option value="zh">Chinese</option>'
			+ '<option value="nl">Dutch</option>	<option value="el">Greek</option>'
			+ '<option value="it">Italian</option>	<option value="ja">Japanese</option>'
			+ '<option value="ko">Korean</option>	<option value="pl">Polish</option>'
			+ '<option value="pt">Portuguese</option><option value="ru">Russian</option>';
	return html;
}

function makeDraggable(eleId, dragButtonId){
	var dragButton; 
	if (dragButtonId){
		dragButton = document.getElementById(dragButtonId);
	}
	var myBlock = document.getElementById(eleId);
	
	// create a simple instance on our object
	var mc;
	if (dragButton)	mc = new Hammer(dragButton);
	else 			mc = new Hammer(myBlock);

	// add a "PAN" recognizer to it (all directions)
	mc.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }));
	mc.on("pan", handleDrag);

	var lastPosX = 0;
	var lastPosY = 0;
	var isDragging = false;

	function handleDrag(ev){
		var elem = myBlock; //ev.target;
		
		//DRAG STARTED
		if (!isDragging){
			isDragging = true;
			lastPosX = elem.offsetLeft;
			lastPosY = elem.offsetTop;
		}		
		var posX = ev.deltaX + lastPosX;
		var posY = ev.deltaY + lastPosY;
		
		//move our element to that position
		elem.style.left = posX + "px";
		elem.style.top = posY + "px";
		
		//DRAG ENDED
		if (ev.isFinal){
			isDragging = false;
		}
	}
}

//FUNCTION calls

function callFunSync(fun, N, i, finishedCallback){
	fun(function(){
		i++;
		if (i < N){
			callFunSync(fun, N, i, finishedCallback);
		}else{
			finishedCallback();
		}
	});
}
function callFunAsync(fun, N, j, finishedCallback){
	var callsFinished = 0;
	for (var i=j; i<N; i++){
		setTimeout(function(){
			fun(function(){
				callsFinished++;
				if (callsFinished >= N){
					finishedCallback();
				}
			});
		}, i*parseInt(delay_N.value));
	}
}

//REST calls (SEPIA API)

/* 	SAMPLE POST:
	genericPostRequest("chat", "createChannel", 
		{
			"channelId" : channelId,
			"members" : members,
			"isPublic" : false,
			"addAssistant" : true
		},
		function (data){
			console.log("SUCCESS:");
			console.log(data);
			showMessage(JSON.stringify(data, null, 2));
		},
		function (data){
			console.log("FAIL:");
			console.log(data);
			showMessage(JSON.stringify(data, null, 2));
		}
	);
*/

//generic GET request (SEPIA API)
function genericGetRequest(link, successCallback, errorCallback){
	//console.log("GET: " + link);
	showMessage("Loading ...");
	$.ajax({
		url: link,
		timeout: 10000,
		type: "get",
		//dataType: "jsonp",
		success: function(data) {
			//console.log(data);
			closeMessage();
			var jsonData = convertData(data);
			if (jsonData.result && jsonData.result === "fail"){
				if (errorCallback) errorCallback(jsonData);
			}else{
				if (successCallback) successCallback(jsonData);
			}
		},
		error: function(data) {
			console.log(data);
			showMessage("ERROR in HTTP GET request.");
			var jsonData = convertData(data);
			if (errorCallback) errorCallback(jsonData);
		}
	});
}

//generic POST request to be used by other test methods (SEPIA API)
function genericPostRequest(apiName, apiPath, parameters, successCallback, errorCallback){
	var apiUrl = getServer(apiName) + apiPath;
	parameters.KEY = getKey();
	//parameters.GUUID = userid;	//<-- DONT USE THAT IF ITS NOT ABSOLUTELY NECESSARY (its bad practice and a much heavier load for the server!)
	//parameters.PWD = pwd;
	parameters.client = getClient();
	console.log('POST request to: ' + apiUrl);
	//console.log(parameters);
	showMessage("Loading ...");
	$.ajax({
		url: apiUrl,
		timeout: 10000,
		type: "POST",
		data: JSON.stringify(parameters),
		headers: {
			//"content-type": "application/x-www-form-urlencoded"
			//"content-type": "text/plain"
			"Content-Type": "application/json"
		},
		success: function(data) {
			//console.log(data);
			closeMessage();
			postSuccess(data, successCallback, errorCallback);
		},
		error: function(data) {
			console.log(data);
			showMessage("ERROR in HTTP POST request.");
			postError(data, errorCallback);
		}
	});
}
//generic POST request to be used by other test methods
function genericFormPostRequest(apiName, apiPath, parameters, successCallback, errorCallback){
	var apiUrl = getServer(apiName) + apiPath;
	parameters.KEY = getKey();
	parameters.client = getClient();
	console.log('POST request to: ' + apiUrl);
	//console.log(parameters);
	showMessage("Loading ...");
	$.ajax({
		url: apiUrl,
		timeout: 10000,
		type: "POST",
		data: parameters,
		headers: {
			"content-type": "application/x-www-form-urlencoded"
		},
		success: function(data) {
			//console.log(data);
			closeMessage();
			postSuccess(data, successCallback, errorCallback);
		},
		error: function(data) {
			console.log(data);
			showMessage("ERROR in HTTP FORM POST request.");
			postError(data, errorCallback);
		}
	});
}
function postSuccess(data, successCallback, errorCallback){
	var jsonData = convertData(data);
	if (jsonData.result && jsonData.result === "fail"){
		if (errorCallback) errorCallback(jsonData);
	}else{
		if (successCallback) successCallback(jsonData);
	}
}
function postError(data, errorCallback){
	console.log("POST error");
	var jsonData = convertData(data);
	if (errorCallback) errorCallback(jsonData);
}
function convertData(data){
	if (data.readyState != undefined){
		if (data.readyState == 0){
			return ({
				msg: "Request was not sent! Plz check connection to server.",
				info: data
			});
		}
		if (data.readyState == 4 && data.status == 404){
			return ({
				msg: "Endpoint not found! Did you select the right server?",
				info: data
			});
		}
	}
	var jsonData;
	if (data.responseJSON){
		jsonData = data.responseJSON;
	}else if (data.responseText){
		try {
			jsonData = JSON.parse(data.responseText);
		}catch(err){
			jsonData = data.responseText;
		}
	}else{
		try {
			jsonData = JSON.parse(data);
		}catch(err){
			jsonData = data;
		}
	}
	return jsonData;
}

//REST calls (general HTTP)

function httpRequest(url, successCallback, errorCallback, method, data, headers, maxwait){
	showMessage("Loading ...");
	if (!maxwait) maxwait = 10000;
	var config = {
		url: url,
		timeout: maxwait,
		type: "GET",
		success: function(data) {
			showMessage("Result: success");
			//console.log(data);
			if (successCallback) successCallback(data);
		},
		error: function(xhr, status, error) {
			showMessage("Result: error");
			console.log(xhr);
			if (errorCallback) errorCallback(xhr, status, error);
		}
	};
	if (method){
		config.type = method;
	}
	if (data){
		config.data = data;
	}
	if (headers){
		config.headers = headers;
	}
	console.log(config.type + ' request to: ' + url);
	$.ajax(config);
}