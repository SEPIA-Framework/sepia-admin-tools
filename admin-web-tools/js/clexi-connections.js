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

//CLEXI

var clexiLogOut = document.getElementById('client-clexi-events');
var numOfClexiSendRetries = 10;

function clexiEventLog(msg, color){
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
		
ClexiJS.onLog = clexiEventLog;
//ClexiJS.onDebug = clexiEventLog;
ClexiJS.onError = clexiEventError;

function clientClexiConnect(){
	var clexiHost = $('#client-clexi-host').val();
	ClexiJS.serverId = $('#client-clexi-id').val();
	if ('sessionStorage' in window){
		sessionStorage.setItem('clientClexiHost', clexiHost);
		sessionStorage.setItem('clientClexiId', ClexiJS.serverId);
	}
	
	//NOTE: something to try as well: ClexiJS.pingAndConnect(host, onPingOrIdError, onOpen, onClose, onError, onConnecting);
	ClexiJS.connect(clexiHost, function(e){
		//log("CLEXI - ready.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').addClass('secure');
		//listen to events:
		clexiSubscribe();
		
	}, function(e){
		//log("CLEXI - lost connection.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').removeClass('secure');
		clexiRemoveSubscriptions();
		
	}, function(err){
		//log("CLEXI - something went wrong.");
		$('#clexi-server-indicator').removeClass('inactive');
		$('#clexi-server-indicator').removeClass('secure');
		clexiRemoveSubscriptions();
	});
	//log("Connecting to CLEXI...");
}
function clientClexiDisconnect(){
	ClexiJS.close();
	$('#clexi-server-indicator').addClass('inactive');
	$('#clexi-server-indicator').removeClass('secure');
}

function clientClexiHelp(){
	showMessage("Commands to try for message type 'SEPIA Client':\n\n"
		+ "- ping all\n\n"
		+ "- call logout\n\n"
		+ "- call login user [id] password [pwd]\n\n"
		+ "- call reload\n\n"
		+ "- call ping / call ping adr [URL]\n\n"
		+ "- call test\n\n"
		+ "- get help\n\n"
		+ "- get user\n\n"
		+ "- get wakeword\n\n"
		//+ "- set useGamepads true\n\n"
	+ "\nCommands to try for type 'Remote Button'\n\n"
		+ "- deviceId [id] button [mic, back, ao, next, prev]\n\n"
		+ "NOTE: To use remote buttons you currently need to enable 'useGamepads' in client settings."
	);
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
	}
}

function clexiBroadcast(msg){
	ClexiJS.send('clexi-broadcaster', msg, numOfClexiSendRetries);
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
function clexiSubscribe(){
	subscribeToClexiBeaconScanner();
	subscribeToClexiBroadcaster();
	subscribeToClexiHttpEvents();
}
function clexiRemoveSubscriptions(){
	ClexiJS.removeSubscription('clexi-broadcaster');
	ClexiJS.removeSubscription('clexi-http-events');
	ClexiJS.removeSubscription('ble-beacon-scanner');
}