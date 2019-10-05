//test account and get login-token
function getLoginToken(successCallback, errorCallback){
	genericPostRequest("assist", "authentication", 
		{
			//"KEY" : getKey(),
			//"client" : client_info,
			"action" : "validate"
		}, 
		successCallback, errorCallback
	);
}
function checkLoginToken(successCallback, errorCallback){
	genericPostRequest("assist", "authentication", 
		{
			"action" : "check"
		}, 
		successCallback, errorCallback
	);
}
function showLoginToken(){
	//NOTE: old method that does not use the ByteMind login-box - might not use all features ...
	getLoginToken(function(data){
		$('#id').val(data.uid);
		$('#pwd').val(data.keyToken);
		
		//refresh stored key (session storage) and security indicator
		getKey();	//TODO: this not up-to-date
		
		//refresh account (updated method)
		var account = ByteMind.account.storeData(data);		//as 'defined' in index.js
		account.lastRefresh = new Date().getTime();
		account.url = ByteMind.account.apiURL;
		ByteMind.account.data = account;
		ByteMind.data.set('account', account);
		
		showMessage(JSON.stringify(data, null, 2));
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

//logout
function logoutThis(successCallback, errorCallback){
	//NOTE: new method
	ByteMind.account.logoutAction();
	sessionStorage.setItem('pwd', '');
	/* --- old method ---
	genericPostRequest("assist", "authentication", {"action" : "logout"}, 
		function(data){
			showMessage(JSON.stringify(data, null, 2));
			//remove session storage and value of password field
			$('#pwd').val("");
			sessionStorage.setItem('pwd', "");
			//remove ByteMind login data
			if (window.ByteMind) ByteMind.data.del('account');

			if (successCallback) successCallback(data);
		}, function(data){
			showMessage(JSON.stringify(data, null, 2));
			//remove session and ByteMind login data anyway
			$('#pwd').val("");
			sessionStorage.setItem('pwd', "");
			if (window.ByteMind) ByteMind.data.del('account');

			if (errorCallback) errorCallback(data);
		}
	);
	*/
}
function logoutAll(successCallback, errorCallback){
	//NOTE: old method but should still work (check proper clean-up again maybe?)
	genericPostRequest("assist", "authentication", {"action" : "logoutAllClients"}, 
		function(data){
			showMessage(JSON.stringify(data, null, 2));
			//remove session storage and value of password field
			$('#pwd').val("");
			sessionStorage.setItem('pwd', "");
			//remove ByteMind login data
			if (window.ByteMind) ByteMind.data.del('account');
			if (successCallback) successCallback(data);
		}, function(data){
			showMessage(JSON.stringify(data, null, 2));
			//remove session and ByteMind login data anyway
			$('#pwd').val("");
			sessionStorage.setItem('pwd', "");
			if (window.ByteMind) ByteMind.data.del('account');
			if (errorCallback) errorCallback(data);
		}
	);
}

//check server status
function serverStatus(apiName){
	if (apiName && apiName.indexOf('mesh') >= 0){
		//POST
		httpRequest(getServer(apiName) + "server-stats", function(data){
			//showMessage(JSON.stringify(data, null, 2));
			showMessage("Success.<br><br>" + data.stats, true);
		}, function(data){
			showMessage(JSON.stringify(data, null, 2));
		}, "POST", JSON.stringify({
			"pin" : $('#mesh-node-pin').val()
		}), {
			"content-type": "application/json"
		}, 8000);
	}else{
		//FORM POST - TODO: this inconsistency should be resolved at some point
		genericFormPostRequest(apiName, "hello", {}, function(data){
			showMessage(data.reply, true);
		}, function(data){
			showMessage(JSON.stringify(data, null, 2));
		});
	}
}

//validate server
function serverValidation(apiName){
	var link = getServer(apiName) + "validate?challenge=" + encodeURIComponent('myTest');
	genericGetRequest(link, function(data){
		showMessage(JSON.stringify(data, null, 2));
		//TODO: compare to expected signature
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

//test authentication performance
function testAuthPerformance(){
	var N = parseInt(test_N.value);
	var errors = 0;
	var sync = synch_select.options[synch_select.selectedIndex].value;
	var accountResults = [];
	var accountErrors = [];
	var callFun;
	if (sync != "sync"){
		callFun = callFunAsync;
		console.log("testing asynchronous");
	}else{
		callFun = callFunSync;
		console.log("testing synchronous");
	}
	var i = 0;
	callFun(function(callback){
		var tic = new Date().getTime();
		var j = ++i;
		console.log(j + " - " + tic);
		checkLoginToken(function(){
			var toc = new Date().getTime();
			console.log(j + " - " + toc);
			accountResults.push(toc-tic);
			callback();
		}, function(){
			var toc = new Date().getTime();
			console.log(j + " - error - " + toc);
			accountErrors.push(toc-tic);
			errors++;
			callback();
		});
	}, N, 0, function(){
		console.log("done");
		console.log(accountResults);
		console.log(accountErrors);
		var sum = accountResults.reduce(function(a, b) { return a + b; });
		var avg = sum / accountResults.length;
		var msg = "DONE" 
			+ "<br>Result times (ms): " + accountResults 
			+ "<br>Error times (ms): " + accountErrors
			+ "<br>Average (ms): " + avg
			+ "<br>Minimum (ms): " + Math.min(...accountResults)
			+ "<br>Maximum (ms): " + Math.max(...accountResults);
		showMessage(msg);
	});
}