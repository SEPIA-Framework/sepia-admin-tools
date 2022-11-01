//Client connections via CLEXI (and other servers?)

var lastClientClexiInput = "";

function clientConnectionsOnStart(){
	if ('sessionStorage' in window){
		$('#client-clexi-host').val(sessionStorage.getItem('clientClexiHost') || "ws://raspberrypi.local:9090/clexi");
		$('#client-clexi-id').val(sessionStorage.getItem('clientClexiId') || "clexi-123");
		$('#client-clexi-auth-user').val(sessionStorage.getItem('clientClexiAuthUser') || "");
		$('#client-clexi-auth-pwd').val(sessionStorage.getItem('clientClexiAuthPwd') || "");
	}
	$('#client-clexi-msg').off().on('keypress', function (e){
		if (e.key === 'Enter'){
			lastClientClexiInput = $('#client-clexi-msg').val();
			clientClexiSend();
		}
	}).on('keyup', function (e){
		if (e.key === 'ArrowUp'){
			$('#client-clexi-msg').val(lastClientClexiInput);
		}else if (e.key === 'ArrowDown'){
			$('#client-clexi-msg').val("");
		}
	});
}
function getOwnClientConnections(successCallback, errorCallback){
	genericPostRequest("chat", "getOwnClientConnections", {}, function(data){
		if (successCallback){
			successCallback(data.clients);
		}else{
			if (!data.clients || data.clients.length == 0){
				showMessage("- no connected clients found -");
			}else{
				showMessage(JSON.stringify(data.clients, null, 2));
			}
		}
	}, function(err){
		if (errorCallback){
			errorCallback(err);
		}else{
			showMessage(JSON.stringify(err, null, 2));
		}
	});
}

//CLEXI

var clexiLogOut = document.getElementById('client-clexi-events');
var numOfClexiSendRetries = 10;
var clexiLogFilter = {
	ble_beacon: true,
	broadcast: true,
	http: true,
	runtime_cmd: true,
	gpio_interface: true
}
function clientClexiSetEventFilters(){
	showMessage("<div>" +
		"<p>Setup Remote Terminal</p>" +
		"<div>Log Broadcasts: <input type='checkbox' " 
			+ "onchange='(function(){ clexiLogFilter.broadcast = !clexiLogFilter.broadcast; console.log(clexiLogFilter); })();' " 
			+ (clexiLogFilter.broadcast? "checked" : "") + "></div>" +
		"<div>Log BLE Beacon data: <input type='checkbox' "
			+ "onchange='(function(){ clexiLogFilter.ble_beacon = !clexiLogFilter.ble_beacon; console.log(clexiLogFilter); })();' " 
			+ (clexiLogFilter.ble_beacon? "checked" : "") + "></div>" +
		"<div>Log HTTP Events: <input type='checkbox' " 
			+ "onchange='(function(){ clexiLogFilter.http = !clexiLogFilter.http; console.log(clexiLogFilter); })();' " 
			+ (clexiLogFilter.http? "checked" : "") + "></div>" +
		"<div>Log Runtime CMD Events: <input type='checkbox' " 
			+ "onchange='(function(){ clexiLogFilter.runtime_cmd = !clexiLogFilter.runtime_cmd; console.log(clexiLogFilter); })();' " 
			+ (clexiLogFilter.runtime_cmd? "checked" : "") + "></div>" +
		"<div>Log GPIO Interface Events: <input type='checkbox' " 
			+ "onchange='(function(){ clexiLogFilter.gpio_interface = !clexiLogFilter.gpio_interface; console.log(clexiLogFilter); })();' " 
			+ (clexiLogFilter.gpio_interface? "checked" : "") + "></div>" +
	"</div>", true);
}

function clexiEventLog(msg, color){
	if (msg.indexOf("Broadcast") == 0){
		if (clexiLogFilter.broadcast == false){
			return;
		}
		if (!color){
			if (msg.indexOf("_error") > 0 || msg.indexOf("-error") > 0 || msg.indexOf('"error"') > 0){
				color = "#f00";
			}else if (msg.indexOf("sepia-state") > 0){
				color = "#b9efcf";
			}else if (msg.indexOf("sepia-speech") > 0 || msg.indexOf("sepia-wake-word") > 0){
				color = "#f1a508";
			}else if (msg.indexOf("sepia-alarm-event") > 0){
				if (msg.indexOf('"triggered"') > 0){
					color = "#ceff1a";
				}else{
					color = "#ebff7b";
				}
			}else if (msg.indexOf("sepia-audio-player-event") > 0){
				color = "#b964ce";
			}
		}
	}else if (msg.indexOf("BLE") == 0){
		if (clexiLogFilter.ble_beacon == false){
			return;
		}
	}else if (msg.indexOf("HTTP") == 0){
		if (clexiLogFilter.http == false){
			return;
		}
	}
	else if (msg.indexOf("Runtime") == 0){
		if (clexiLogFilter.runtime_cmd == false){
			return;
		}
	}
	else if (msg.indexOf("GPIO") == 0){
		if (clexiLogFilter.gpio_interface == false){
			return;
		}
	}
	if (color){
		clexiLogOut.innerHTML = ("<span style='color: " + color + ";'>" + msg + "</span><br>" + clexiLogOut.innerHTML);
	}else{
		clexiLogOut.innerHTML = ("<span>" + msg + "</span><br>" + clexiLogOut.innerHTML);
	}
	//clexiLogOut.scrollTop = clexiLogOut.scrollHeight;
}
function clexiEventError(msg){
	clexiLogOut.innerHTML = ("<span style='color: #f00;'>" + msg + "</span><br>" + clexiLogOut.innerHTML);
	//clexiLogOut.scrollTop = clexiLogOut.scrollHeight;
}
var clexiDebugEventColor = "#888";
var clexiBleBeaconColor = "#2196F3";
var clexiHttpEventColor = "#009688";
var clexiRuntimeCommandsColor = "#cce";
var clexiGpioInterfaceColor = "#2fcde7";
		
ClexiJS.onLog = clexiEventLog;
//ClexiJS.onDebug = clexiEventLog;
ClexiJS.onError = clexiEventError;

function clientClexiConnect(){
	var clexiHost = $('#client-clexi-host').val();
	if (!clexiHost){
		clexiEventError("Connection not possible. Please enter the CLEXI URL first!");
		return;
	}else if (location.protocol == "https:" && location.hostname != "localhost" && clexiHost.toLowerCase().indexOf("ws:/") == 0){
		clexiEventError("Connection error! You cannot mix 'https:' with 'ws:' URLs. Please use the local, non-SSL URL of the Control-HUB to connect to CLEXI instead.");
		return;
	}
	ClexiJS.serverId = $('#client-clexi-id').val();
	if ('sessionStorage' in window){
		sessionStorage.setItem('clientClexiHost', clexiHost);
		sessionStorage.setItem('clientClexiId', ClexiJS.serverId);
	}
	ClexiJS.clientBaseId = "SEPIA-hub-";
	
	//set 'try' status
	$('#clexi-server-indicator').removeClass('inactive');
	$('#clexi-server-indicator').removeClass('secure');
	$('#clexi-server-indicator').addClass('yellow');
	
	//NOTE: something to try as well: ClexiJS.pingAndConnect(host, onPingOrIdError, onOpen, onClose, onError, onConnecting);
	ClexiJS.pingAndConnect(clexiHost, function(err){
		//log("CLEXI - ping failed.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').removeClass('secure');
		$('#clexi-server-indicator').removeClass('yellow');
		clexiEventError(err.msg);
		clexiRemoveSubscriptions();
	
	}, function(e){
		//log("CLEXI - ready.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').removeClass('yellow');
		$('#clexi-server-indicator').addClass('secure');
		
	}, function(e){
		//log("CLEXI - lost connection.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').removeClass('secure');
		$('#clexi-server-indicator').removeClass('yellow');
		clexiRemoveSubscriptions();
		
	}, function(err){
		//log("CLEXI - something went wrong.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').removeClass('secure');
		$('#clexi-server-indicator').removeClass('yellow');
		clexiRemoveSubscriptions();
	
	}, function(){
		//log("CLEXI - connecting.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').removeClass('secure');
		$('#clexi-server-indicator').addClass('yellow');
	
	}, function(welcomeInfo){
		//log("CLEXI - welcome event.");
		//listen to events:
		clexiSubscribe();
	});
	//log("Connecting to CLEXI...");
}
function clientClexiDisconnect(){
	ClexiJS.close();
	$('#clexi-server-indicator').addClass('inactive');
	$('#clexi-server-indicator').removeClass('secure');
}

function clientClexiHelp(){
	showMessage("<u>Commands to try for message type 'SEPIA Client':</u>\n\n"
		+ "- ping all\n\n"
		+ "- call logout\n\n"
		+ "- call login user [id] password [pwd]\n\n"
		+ "- call reload\n\n"
		+ "- call ping / call ping adr [URL]\n\n"
		+ "- call test\n\n"
		+ "- call mictest play recording\n\n"
		+ "- get help\n\n"
		+ "- get user\n\n"
		+ "- get wakeword\n\n"
		+ "- get mediadevices\n\n"
		+ "- get microphone\n\n"
		+ "- set wakeword state on/off\n\n"
		+ "- set microphone gain [0.1-100]\n\n"
		+ "- set connections client on/off/connect/close\n\n"
		+ "- set connections clexi off/close\n\n"
		//+ "- set useGamepads true\n\n"
	+ "\n<u>Commands to try for type 'Remote Button'</u>\n\n"
		+ "- deviceId [id] button [mic, micReset, back, ao, next, prev, connect, disconnect]\n\n"
		+ "<b>NOTE:</b> To use remote buttons you currently need to enable 'useGamepads' in client settings.\n\n"
	+ "\n<u>Commands to try for type 'Runtime Command'</u>\n\n"
		+ "- osReboot\n\n"
		+ "- osShutdown delay 15000\n\n"
		+ "- removeScheduled cmdId [cmd-ID]\n\n"
		+ "- freeMemory\n\n"
		+ "- callCustom delay 5000 file echo TEXT Hello-World\n\n"
		+ "<b>NOTE:</b> To use runtime commands make sure CLEXI has them installed and activated.\n\n"
	+ "\n<u>Commands to try for type 'GPIO Interface' (on Raspberry Pi)</u>\n\n"
		+ "- get all\n\n"
		+ "- release all\n\n"
		+ "- register button 17\n\n"
		+ "- release button {\"id\":\"my-btn\",\"pin\":17}\n\n"
		+ "- register led 19\n\n"
		+ "- set led {\"pin\":5,\"value\":1}\n\n"
		+ "- register item rpi-respeaker-mic-hat-leds {\"numOfLeds\":3}\n\n"
		+ "- set item rpi-respeaker-mic-hat-leds {\"ledIndex\":1,\"red\":150,\"green\":0,\"blue\":0}\n\n"
		+ "- release item rpi-respeaker-mic-hat-leds {}\n\n"
		+ "<b>NOTE:</b> To use the GPIO interface make sure it is activated in CLEXI settings.\n\n"
	, true);
}
function clientClexiShortcutPingAll(){
	clientClexiSend("ping all", "sepia-client");
}
function clientClexiShortcutReload(){
	clientClexiSend("call reload", "sepia-client");
}
function clientClexiShortcutTest(){
	clientClexiSend("call test", "sepia-client");
}
function clientClexiShortcutTrigger(){
	var deviceId = $('#client-clexi-device-id').val();
	if (!deviceId){
		clexiEventError("Please enter a device ID first.");
		return;
	}
	clientClexiSend("deviceId " + deviceId + " button mic", "remote-button");
}

function clientClexiEventsClear(){
	clexiLogOut.innerHTML = "";
}

var clientClexiTerminalCommands = {
	clear: clientClexiEventsClear,
	help: clientClexiHelp
}

function clientClexiSend(msg, msgType){
	if (!msg) msg = $('#client-clexi-msg').val();
	if (!msgType) msgType = $('#client-clexi-msg-type').val();
	msg = msg.trim();
	if (clientClexiTerminalCommands[msg]){
		clientClexiTerminalCommands[msg]();
		lastClientClexiInput = msg;
		$('#client-clexi-msg').val("");
		return;
	}
	if (msgType == "broadcast"){
		//Broadcast
		clexiBroadcast(msg);
		$('#client-clexi-msg').val("");
		
	}else if (msgType == "sepia-client"){
		var deviceId = $('#client-clexi-device-id').val();
		if (!deviceId && msg.indexOf("deviceId ") < 0 && msg != "ping all"){
			clexiEventError("Please enter a device ID first or use 'ping all' to ask all clients to report their IDs.");
			return;
		}else if (msg == "ping all"){
			clexiBroadcast({
				name: "sepia-client",
				data: {
					ping: "all"
				}
			});
			$('#client-clexi-msg').val("");
		}else{
			var ev = {
				name: "sepia-client",
				data: {
					deviceId: deviceId
				}
			};
			var dataArray = msg.split(" ");
			if (dataArray.length >= 2 && dataArray.length % 2 == 0){
				for (var i=0; i<dataArray.length; i+=2){
					ev.data[dataArray[i].replace(/^[-]+/,"")] = dataArray[i+1];
				}
				clexiBroadcast(ev);
				$('#client-clexi-msg').val("");
			}else{
				clexiEventError("Wrong message input format! Should be: '[parameter1] [val1] [parameter2] ...' (no spaces allowed in parameters).");
			}
		}
		
	}else if (msgType == "http-event"){
		//Http event
		var dataArray = msg.split(" ");
		if (dataArray.length >= 3 && dataArray.length % 2 == 1){
			var name = dataArray.shift();
			var ev = {
				name: name,
				data: {}
			};
			for (var i=0; i<dataArray.length; i+=2){
				ev.data[dataArray[i].replace(/^[-]+/,"")] = dataArray[i+1];
			}
			clexiHttpEvent(ev);
			$('#client-clexi-msg').val("");
		}else{
			clexiEventError("Wrong message input format! Should be: '[event-name] [parameter1] [val1] [parameter2] ...' (no spaces allowed in parameters).");
		}
		
	}else if (msgType == "remote-button"){
		//Remote Button
		var dataArray = msg.split(" ");
		if (dataArray.length == 4){
			var ev = {
				name: "remote-button",
				data: {
					deviceId: dataArray[1],
					button: dataArray[3]
				}
			}
			clexiHttpEvent(ev);
			$('#client-clexi-msg').val("");
		}else{
			clexiEventError("Wrong message input format! Should be, e.g. 'deviceId o1 button mic' (no spaces allowed in parameters).");
		}
	
	}else if (msgType == "runtime-command"){
		//Runtime Command
		var dataArray = msg.split(" ");
		var cmd = dataArray.shift();
		var args = {};
		//shortcuts
		if (cmd == "osShutdown" || cmd == "os_shutdown"){
			cmd = "callCustom";
			dataArray.push("file");
			dataArray.push("os_shutdown");
		}else if (cmd == "osReboot" || cmd == "os_reboot"){
			cmd = "callCustom";
			dataArray.push("file");
			dataArray.push("os_reboot");
		}
		if (dataArray.length >= 2 && dataArray.length % 2 == 0){
			for (var i=0; i<dataArray.length; i+=2){
				args[dataArray[i].replace(/^[-]+/,"")] = dataArray[i+1];
			}
		}else if (dataArray.length > 0){
			clexiEventError("Wrong message input format! Should be: '[command] [parameter1] [val1] [parameter2] ...' (no spaces allowed in parameters).");
			return;
		}
		$('#client-clexi-msg').val("");
		clexiRuntimeCommand(cmd, args);
	
	}else if (msgType == "gpio-interface"){
		//GPIO Interface
		var dataArray = msg.split(" ");
		var action;
		var type;
		if (dataArray.length >= 2){
			action = dataArray[0];
			type = dataArray[1];
		}
		if (dataArray.length == 2){
			clexiGpioInterfaceRequestDefault(action, type);
			$('#client-clexi-msg').val("");
		}else if (dataArray.length == 3){
			var pinOrJson = dataArray[2];
			var config;
			if (pinOrJson.indexOf("{") == 0){
				config = JSON.parse(pinOrJson);
			}else if (type == "button" || type == "led"){
				//some support for simplified syntax
				config = {pin: +pinOrJson, direction: null, edge: null, options: null};
			}
			if (config){
				clexiGpioInterfaceRequestDefault(action, type, config);
				$('#client-clexi-msg').val("");
			}else{
				clexiEventError("Wrong message input format! Try e.g.: 'register button {\"id\":\"hw-mic-button\",\"pin\":17}' or 'register item [file] [options-json]' (no spaces allowed in JSON!).");
			}
		}else if (dataArray.length == 4 && type == "item"){
			var file = dataArray[2];
			var optionsOrData = JSON.parse(dataArray[3]);
			var options, data;
			if (action == "set"){
				data = optionsOrData;
			}else{
				options = optionsOrData;
			}
			clexiGpioInterfaceRequestDefault(action, type, {
				file: file,
				options: options || null,
				data: data || null
			});
			$('#client-clexi-msg').val("");
		}else{
			clexiEventError("Wrong message input format! Should be '[action] [type]', '[action] [type] [data]' or '[action] item [file] [options-or-data-json]' e.g. 'get all', 'register button {\"pin\":17}' or 'register item my-file {\"my-opt\":\"up\"}' (no spaces allowed in parameters and JSON!).");
		}
	}
}

function clexiBroadcast(msg){
	ClexiJS.send('clexi-broadcaster', msg, numOfClexiSendRetries);
}

function clexiRuntimeCommand(cmd, args){
	ClexiJS.send('runtime-commands', {
		id: getNewClexiRuntimeCmdId(),
		cmd: cmd,
		args: args
	}, numOfClexiSendRetries);
}
function getNewClexiRuntimeCmdId(){
	if (!clexiRuntimeCommandBaseId){
		clexiRuntimeCommandBaseId = "SEPIA-HUB-" + Math.abs(sjcl.random.randomWords(1));
	}
	return (clexiRuntimeCommandBaseId + "-" + ++clexiRuntimeCommandLastIdIndex);
}
var clexiRuntimeCommandBaseId;
var clexiRuntimeCommandLastIdIndex = 0;

function clexiGpioInterfaceRequestDefault(action, type, config){
	ClexiJS.send('gpio-interface', {
		action: action,
		type: type,
		config: config
	}, numOfClexiSendRetries);
}

function clexiHttpEvent(ev, successCallback, errorCallback){
	var clexiHost = $('#client-clexi-host').val();
	ClexiJS.serverId = $('#client-clexi-id').val();
	var hostURL = clexiHost.replace(/^wss/, 'https').replace(/^ws/, 'http');
	var headers = {
		"Content-Type": "application/json",
		"clexi-id": ClexiJS.serverId
		//TODO: add Basic Auth. data here ...
		//"Authorization": ("Basic " + btoa($('#client-clexi-auth-user').val() + ":" + $('#client-clexi-auth-pwd').val()))
	};
	if (!successCallback) successCallback = console.log;	//clexiEventLog;
	if (!errorCallback) errorCallback = console.error; 		//clexiEventError;
	if (clexiHost && ev && ev.name && ev.data){
		showMessage("Loading ...");
		var config = {
			url: (hostURL + "/event/" + ev.name),
			timeout: 5000,
			type: "POST",
			data: ((typeof ev.data == "object")? JSON.stringify(ev.data) : ev.data),
			headers: headers,
			success: function(data) {
				closeMessage();
				if (successCallback) successCallback(data);
			},
			error: function(xhr, status, error) {
				showMessage("Result: error");
				console.log(xhr);
				if (errorCallback) errorCallback(xhr, status, error);
			}
		};
		console.log(config.type + ' request to: ' + config.url + " - with data: ");
		console.log(ev);
		$.ajax(config);
	}
	/*
	//HTTP GET via ClexiJS (useful for very simple clients)
	var eventName = "testEvent";
	var eventData = "num=42";
	ClexiJS.httpRequest("GET", hostURL + "/event/" + eventName + "?" + eventData, function(data){}, function(){
		//Error
		console.error({msg:"CLEXI connection failed! Server not reached."});
	});
	*/
}

//--------- Subscriptions ---------

function subscribeToClexiBeaconScanner(){
	ClexiJS.subscribeTo('ble-beacon-scanner', function(e){
		clexiEventLog('BLE Beacon event: ' + JSON.stringify(e), clexiBleBeaconColor);
	}, function(e){
		clexiEventLog('BLE Beacon response: ' + JSON.stringify(e), clexiDebugEventColor);
	}, function(e){
		clexiEventError('BLE Beacon error: ' + JSON.stringify(e));
	});
}
function subscribeToClexiBroadcaster(){
	ClexiJS.subscribeTo('clexi-broadcaster', function(e){
		clexiEventLog('Broadcaster event: ' + JSON.stringify(e));
	}, function(e){
		clexiEventLog('Broadcaster response: ' + JSON.stringify(e), clexiDebugEventColor);
	}, function(e){
		clexiEventError('Broadcaster error: ' + JSON.stringify(e));
	});
}
function subscribeToClexiHttpEvents(){
	ClexiJS.subscribeTo('clexi-http-events', function(e){
		clexiEventLog('HTTP event: ' + JSON.stringify(e), clexiHttpEventColor);
	}, function(e){
		clexiEventLog('HTTP response: ' + JSON.stringify(e), clexiDebugEventColor);
	}, function(e){
		clexiEventError('HTTP error: ' + JSON.stringify(e));
	});
}
function subscribeToRuntimeCommands(){
	ClexiJS.subscribeTo('runtime-commands', function(e){
		clexiEventLog('Runtime CMD event: ' + JSON.stringify(e), clexiRuntimeCommandsColor);
	}, function(e){
		clexiEventLog('Runtime CMD response: ' + JSON.stringify(e), clexiDebugEventColor);
	}, function(e){
		clexiEventError('Runtime CMD error: ' + JSON.stringify(e));
	});
}
function subscribeToGpioInterface(){
	ClexiJS.subscribeTo('gpio-interface', function(e){
		clexiEventLog('GPIO-Interface event: ' + JSON.stringify(e), clexiGpioInterfaceColor);
	}, function(e){
		clexiEventLog('GPIO-Interface response: ' + JSON.stringify(e), clexiDebugEventColor);
	}, function(e){
		clexiEventError('GPIO-Interface error: ' + JSON.stringify(e));
	});
}
function subscribeToUndefined(){
	ClexiJS.subscribeTo('undefined', function(e){
		clexiEventLog('Server event: ' + JSON.stringify(e), clexiDebugEventColor);
	}, function(e){
		clexiEventLog('Server event: ' + JSON.stringify(e), clexiDebugEventColor);
	}, function(e){
		clexiEventError('Server event: ' + JSON.stringify(e));
	});
}
function clexiSubscribe(){
	subscribeToClexiBeaconScanner();
	subscribeToClexiBroadcaster();
	subscribeToClexiHttpEvents();
	subscribeToRuntimeCommands();
	subscribeToGpioInterface();
	subscribeToUndefined();
}
function clexiRemoveSubscriptions(){
	ClexiJS.removeSubscription('clexi-broadcaster');
	ClexiJS.removeSubscription('clexi-http-events');
	ClexiJS.removeSubscription('ble-beacon-scanner');
	ClexiJS.removeSubscription('runtime-commands');
	ClexiJS.removeSubscription('gpio-interface');
	ClexiJS.removeSubscription('undefined');
}