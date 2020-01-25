//Client connections via CLEXI (and other servers?)

function clientConnectionsOnStart(){
	if ('sessionStorage' in window){
		$('#client-clexi-host').val(sessionStorage.getItem('clientClexiHost') || "ws://raspberrypi.local:9090/clexi");
		$('#client-clexi-id').val(sessionStorage.getItem('clientClexiId') || "clexi-123");
		$('#client-clexi-auth-user').val(sessionStorage.getItem('clientClexiAuthUser') || "");
		$('#client-clexi-auth-pwd').val(sessionStorage.getItem('clientClexiAuthPwd') || "");
	}
	$('#client-clexi-msg').off().on('keypress', function (e){
		if (e.key === 'Enter'){
			clientClexiSend();
		}
	});
}

//CLEXI

var clexiLogOut = document.getElementById('client-clexi-events');
var numOfClexiSendRetries = 10;

function clexiEventLog(msg){
	clexiLogOut.innerHTML = (msg + "<br>" + clexiLogOut.innerHTML);
	//clexiLogOut.scrollTop = clexiLogOut.scrollHeight;
}
function clexiEventError(msg){
	clexiLogOut.innerHTML = ("<span style='color: #f00;'>" + msg + "</span><br>" + clexiLogOut.innerHTML);
	//clexiLogOut.scrollTop = clexiLogOut.scrollHeight;
}
		
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

function clientClexiSend(msg, msgType){
	if (!msg) msg = $('#client-clexi-msg').val();
	if (!msgType) msgType = $('#client-clexi-msg-type').val();
	msg = msg.trim();
	if (msgType == "broadcast"){
		//Broadcast
		clexiBroadcast(msg);
		$('#client-clexi-msg').val("");
		
	}else if (msgType == "http-event"){
		//Http event
		var dataArray = msg.split(" ");
		if (dataArray.length >= 3 && dataArray.length % 2 == 1){
			var name = dataArray.shift();
			var ev = {
				name: name,
				data: {}
			};
			for (var i=0; i<dataArray; i+=2){
				ev.data[dataArray[i]] = dataArray[i+1];
			}
			clexiHttpEvent(ev);
			$('#client-clexi-msg').val("");
		}else{
			clexiEventError("Wrong message input format! Should be, e.g. 'remote-button deviceId o1 button mic' (no spaces allowed in parameters).");
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
	var hostURL = clexiHost.replace(/^wss/, 'https').replace(/^ws/, 'http');
	var headers = undefined; 		//use e.g. for 'Basic Auth.'
	var method = "POST";
	var maxwait = 5000;
	if (!successCallback) successCallback = console.log;	//clexiEventLog;
	if (!errorCallback) errorCallback = console.error; 		//clexiEventError;
	if (clexiHost && ev && ev.name && ev.data){
		httpRequest(hostURL + "/event/" + ev.name, successCallback, errorCallback, method, ev.data, headers, maxwait);
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
		clexiEventLog('BLE Beacon event: ' + JSON.stringify(e));
	}, function(e){
		clexiEventLog('BLE Beacon response: ' + JSON.stringify(e));
	}, function(e){
		clexiEventLog('BLE Beacon error: ' + JSON.stringify(e));
	});
}
function subscribeToClexiBroadcaster(){
	ClexiJS.subscribeTo('clexi-broadcaster', function(e){
		clexiEventLog('Broadcaster event: ' + JSON.stringify(e));
	}, function(e){
		clexiEventLog('Broadcaster response: ' + JSON.stringify(e));
	}, function(e){
		clexiEventLog('Broadcaster error: ' + JSON.stringify(e));
	});
}
function subscribeToClexiHttpEvents(){
	ClexiJS.subscribeTo('clexi-http-events', function(e){
		clexiEventLog('HTTP event: ' + JSON.stringify(e));
	}, function(e){
		clexiEventLog('HTTP response: ' + JSON.stringify(e));
	}, function(e){
		clexiEventLog('HTTP error: ' + JSON.stringify(e));
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