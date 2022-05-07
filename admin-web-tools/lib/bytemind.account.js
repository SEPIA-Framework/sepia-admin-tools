//required: sjcl, jQuery, ByteMind.ui, ByteMind(core)

//ACCOUNT - Login, logout, login-popup etc. ...	
function bytemind_build_account(){
	var Account = {};
	
	//Overwrite this e.g. in 'index.js' to customize:
	Account.apiURL = "http://localhost:8001";
	Account.setApiURL = function(newURL){
		Account.apiURL = newURL;
		//ByteMind.data.set('account-api-url', newURL); 	//we leave that to the user (index.js)
		broadcastNewAccountURL();
	}
	Account.tokenValidTime = 1000*60*60*24; 	//refresh required after e.g. 1 day
	Account.autoCreateLoginBoxIfMissing = true;
	Account.data; 		//cache for account data from 'Account.storeData'
	var language = ByteMind.config.language;
	
	//---- broadcasting ----
	
	//login
	function broadcastLoginSuccess(){
		window.dispatchEvent(new CustomEvent('bm-account-login-success', {
			detail: { url: Account.apiURL }
		}));
	}
	function broadcastLoginFail(message){
		window.dispatchEvent(new CustomEvent('bm-account-login-error', {
			detail: { message: message }
		}));
	}	
	//logout
	function broadcastLogoutTry(){
	}
	function broadcastLogoutSuccess(){
		window.dispatchEvent(new CustomEvent('bm-account-logout-success', {
			detail: { url: Account.apiURL }
		}));
	}
	function broadcastLogoutFail(message){
		window.dispatchEvent(new CustomEvent('bm-account-logout-error', {
			detail: { message: message }
		}));
	}
	//new api URL
	function broadcastNewAccountURL(){
		window.dispatchEvent(new CustomEvent('bm-account-new-api-url', {
			detail: { url: Account.apiURL }
		}));
	}
	
	//----------------------
	
	//called during login success to store data - Overwrite this e.g. in 'index.js' to customize
	Account.storeData = function(data){
		//store data
		var account = new Object();
		account.userId = data.uid;
		account.userToken = data.keyToken;
		account.language = data.user_lang_code;
		return account;
	}
	
	//return stored data
	Account.getData = function(){
		if (Account.data){
			return Account.data;
		}else{
			return ByteMind.data.get('account');
		}
	}

	//get language
	Account.getLanguage = function(){
		return language;
	}
	
	//Create login box (and keep hidden)
	Account.createLoginBox = function(parentEle){
		var parent = (parentEle)? parentEle : document.body;
		var box = document.createElement('div');
		box.id = 'bytemind-login-box';
		box.style.display = 'none';
		box.innerHTML = "" +
			'<div id="bytemind-login-language-selector"></div>' +
			'<h2>' + ByteMind.local.g('welcome') + '</h2>' +
			'<input id="bytemind-login-id" type="email" placeholder="' + ByteMind.local.g('username') + '" aria-label="Username">' +
			'<input id="bytemind-login-pwd" type="password" placeholder="' + ByteMind.local.g('password') + '" aria-label="Password">' + 
			'<button id="bytemind-login-send">' + ByteMind.local.g('sendLogin') + '</button><br>' +
			'<button id="bytemind-login-close">' + ByteMind.local.g('closeLogin') + '</button><br>' +
			'<p id="bytemind-login-status"><br></p>';
		$(parent).append(box);
		return box;
	}
	//Setup login box by adding button actions
	Account.setupLoginBox = function(box){
		if (!box){
			return;
		}
		//login-button
		var logSendBtn = document.getElementById("bytemind-login-send");
		if (logSendBtn){
			$(logSendBtn).off().on("click", function () {
				sendLoginFromBox();
			});
		}
		//id placeholder
		var idInput = document.getElementById("bytemind-login-id");
		idInput.placeholder = ByteMind.local.username;
		$(idInput).off().on("keypress", function (e) {
			if (e.keyCode === 13) { sendLoginFromBox(); }
		});
		//keypress on pwd
		var pwdInput = document.getElementById("bytemind-login-pwd");
		pwdInput.placeholder = ByteMind.local.password;
		$(pwdInput).off().on("keypress", function (e) {
			if (e.keyCode === 13) { sendLoginFromBox(); }
		});
		//close-button
		var clsBtn = document.getElementById("bytemind-login-close");
		if (clsBtn){
			$(clsBtn).off().on("click", function () {
				Account.toggleLoginBox(false);
				Account.afterLogin();
			});
		}
		//add language selector
		var langSelBox = document.getElementById("bytemind-login-language-selector");
		if (langSelBox){
			//TODO:
			/*
			langSelBox.appendChild(SepiaFW.ui.build.languageSelector("bytemind-login-language-dropdown", function(selectedLanguage){
				var url = SepiaFW.tools.setParameterInURL(window.location.href, 'lang', selectedLanguage);
				window.location.href = url;
			}));
			*/
		}
		//hostname input field
		var $hostInput = $("#bytemind-login-host-name");
		$hostInput.val(Account.apiURL);
		$hostInput.off().on("change", function(){
			var newHost = this.value;
			Account.setApiURL(newHost);
		});
		//extend button
		var $extendBtn = $('#bytemind-login-extend-btn');
		//$extendBtn.find('i').html('arrow_drop_down');
		$extendBtn.off().on("click", function(){
			var isVisible = ($extendBtn.find('i').html() == 'arrow_drop_up');
			$('#bytemind-login-box').find('.bm-extendable').each(function(){
				if (isVisible){
					//$(this).fadeOut(150);
					$(this).hide();
				}else{
					//$(this).fadeIn(300);
					$(this).show();
				}
			});
			if (isVisible){
				$extendBtn.find('i').html('arrow_drop_down');
			}else{
				$extendBtn.find('i').html('arrow_drop_up');
			}
			//$('#bytemind-login-extend-box').hide();
		});

		box.dataset.bmIsActive = true;
		return box;
	}
	
	//Setup login-box
	Account.setup = function(){
		//try restore from localStorage to avoid login popup
		var account = ByteMind.data.get('account');
		var isSameUrl = (account && account.url)? (account.url == Account.apiURL) : false;
		if (isSameUrl && account.lastRefresh && ((new Date().getTime() - account.lastRefresh) < Account.tokenValidTime)){
			language = account.language;	
			if (language) ByteMind.config.broadcastLanguage(language);
			Account.data = account;
			ByteMind.debug.log('Account: login restored');
			
			//close login box
			Account.toggleLoginBox(false);
			
			//TODO: ping API and test credentials
			
			Account.afterLogin();

		//try refresh
		}else if (isSameUrl && account.userId && account.userToken){
			ByteMind.debug.log('Account: trying login auto-refresh with token');
			var isClearText = false;
			Account.login(account.userId, account.userToken, isClearText, onLoginSuccess, function(err){
				//open login box
				Account.toggleLoginBox(true);
				onLoginError(err);
			}, onLoginDebug);
		
		//open login box
		}else{
			Account.toggleLoginBox(true);
		}
	}
	function sendLoginFromBox(){
		var id = document.getElementById("bytemind-login-id").value;
		var pwdField = document.getElementById("bytemind-login-pwd");
		var pwd = pwdField.value;
		var isClearText = true;
		pwdField.value = '';
		if (id && pwd && (id.length > 3) && (pwd.length > 5)) {
			Account.login(id, pwd, isClearText, onLoginSuccess, onLoginError, onLoginDebug);
		}else{
			onLoginError(ByteMind.local.g('loginFailedPlain'));
		}
	}
	function onLoginSuccess(data){
		//close login box
		Account.toggleLoginBox(false);
		
		//store data
		var account = Account.storeData(data);
		account.lastRefresh = new Date().getTime();
		account.url = Account.apiURL;
		Account.data = account;
		ByteMind.data.set('account', account);

		//has language?
		if (account.language){
			language = account.language;
			ByteMind.config.broadcastLanguage(language);
		}
		
		//what happens next? typically this is used by a client implementation to continue
		broadcastLoginSuccess();
		Account.afterLogin();
	}
	function onLoginError(errorText){
		ByteMind.debug.err('Login: ' + errorText);
		var lBoxError = document.getElementById("bytemind-login-status");
		if(lBoxError){
			lBoxError.innerHTML = errorText;
			$(lBoxError).fadeOut(150).fadeIn(150);
		}
		broadcastLoginFail(errorText);
	}
	function onLoginDebug(data){
		//ByteMind.debug.log('Account debug: ' + JSON.stringify(data));
	}
	
	//toggle login box on off
	Account.toggleLoginBox = function(forceState){
		var box = document.getElementById("bytemind-login-box");
		if (box){
			if (!box.dataset.bmIsActive){
				Account.setupLoginBox(box);
			}
			$("#bytemind-login-status").html('');		//reset status text
			if (box.style.display == 'none'){
				if (forceState == false) return;
				$(box).fadeIn(300);
				if (ByteMind.ui){
					ByteMind.ui.showBackgroundCoverLayer($(box).parent()[0]);
				}
			}else{
				if (forceState == true) return;
				//box.style.display = 'none';
				$(box).fadeOut(300);
				if (ByteMind.ui){
					ByteMind.ui.hideBackgroundCoverLayer($(box).parent()[0]);
				}
			}
		}else if (Account.autoCreateLoginBoxIfMissing){
			var box = Account.createLoginBox();
			Account.setupLoginBox(box);
			Account.toggleLoginBox(forceState);
		}
	}
	
	//Logout action e.g. for button
	Account.logoutAction = function(){
		//try logout - fails silently (low prio, good idea?)
		Account.logout(onLogoutSuccess, onLogoutFail, onLogoutDebug);
		//remove data
		ByteMind.data.del('account');
		//open box
		Account.toggleLoginBox(true);
		broadcastLogoutTry();
		//do other user/client actions
		Account.afterLogout();
	}
	function onLogoutSuccess(data){
		ByteMind.debug.log('Account: logout successful');
		broadcastLogoutSuccess();
	}
	function onLogoutFail(msg){
		ByteMind.debug.err('Account: complete logout failed! But local data has been removed.');
		broadcastLogoutFail(msg);
	}
	function onLogoutDebug(data){
		//ByteMind.debug.log('Account debug: ' + JSON.stringify(data));
	}
	
	//---- API communication ----
	
	//LOGIN REQUEST - Overwrite this in index.js (just an example)
	Account.getLoginRequestData = function(userId, pwd, isClearText){
		//hash password?
		if (pwd && isClearText){
			//encrypt
			pwd = getSHA256(pwd);
		}
		var requestBody = {
			action: "validate",
			//GUUID: userId,	//<-- DONT USE THAT IF ITS NOT ABSOLUTELY NECESSARY (USE 'KEY') ...
			//PWD: pwd,			//... it sends clear text password (and is a much heavier load for the server!)
			KEY: (userid + ";" + pwd),
			client: ByteMind.config.clientInfo
		}
		var request = {
			url: Account.apiURL + "/authentication",
			timeout: 5000,
			type: "POST",
			data: JSON.stringify(requestBody),
			headers: {
				"content-type": "application/json"
			}
		}
		return request;
	}
	//LOGIN SUCCESS CONDITION - Overwrite this in index.js (it's just an example)
	Account.loginSuccessTest = function(data){
		return (data.result && data.result === "success");
	}
	//LOGIN CALL
	Account.login = function(userId, pwd, isClearText, successCallback, errorCallback, debugCallback){
		ByteMind.ui.showLoader();
		var request = Account.getLoginRequestData(userId, pwd, isClearText);
		//success
		request.success = function(data){
			ByteMind.ui.hideLoader();
			if (debugCallback) debugCallback(data);
			if (data && data.result){
				if (!Account.loginSuccessTest(data)){
					//TODO: add another 'overwritable' here?
					if (data.code && data.code == 3){
						if (errorCallback) errorCallback(ByteMind.local.g('loginFailedServer'));
					}else if (data.code && data.code == 10){
						if (errorCallback) errorCallback(ByteMind.local.g('loginFailedBlocked'));
					}else{
						if (errorCallback) errorCallback(ByteMind.local.g('loginFailedUser'));
					}
					return;
				
				//assume success
				}else{
					//----callback----
					if (successCallback) successCallback(data);
				}		
			}else{
				if (errorCallback) errorCallback("Login failed! Sorry, but there seems to be an unknown error :-(");
			}
		}
		//error
		request.error = function(data) {
			ByteMind.ui.hideLoader();
			ByteMind.webservice.checkNetwork(function(){
				if (errorCallback) errorCallback("Login failed! Sorry, but it seems the server does not answer :-(");
			}, function(){
				if (errorCallback) errorCallback("Login failed! Sorry, but it seems you are offline :-(");
			});
			if (debugCallback) debugCallback(data);
		}
		//call
		$.ajax(request);
	}
	Account.afterLogin = function(){};
	
	//LOGOUT REQUEST - Overwrite this in index.js (it's just an example)
	Account.getLogoutRequestData = function(){
		var account = Account.getData();
		var requestBody = {
			action: "logout",
			KEY: (account.userId + ";" + account.userToken),
			client: ByteMind.config.clientInfo
		}
		var request = {
			url: Account.apiURL + "/authentication",
			timeout: 5000,
			type: "POST",
			data: JSON.stringify(requestBody),
			headers: {
				"content-type": "application/json"
			}
		}
		return request;
	}
	//LOGOUT SUCCESS CONDITION - Overwrite this in index.js (it's just an example)
	Account.logoutSuccessTest = function(data){
		return (data.result && data.result === "success");
	}
	//LOGOUT CALL
	Account.logout = function(successCallback, errorCallback, debugCallback){
		ByteMind.ui.showLoader();
		var request = Account.getLogoutRequestData();
		//success
		request.success = function(data) {
			ByteMind.ui.hideLoader();
			if (debugCallback) debugCallback(data);
			if (!Account.logoutSuccessTest(data)){
				if (errorCallback) errorCallback('Sorry, but the log-out process failed! Please log-in again to overwrite old token.');
				return;
			}
			//--callback--
			if (successCallback) successCallback(data);
		}
		//error
		request.error = function(data) {
			ByteMind.ui.hideLoader();
			ByteMind.webservice.checkNetwork(function(){
				if (errorCallback) errorCallback('Sorry, but the logout process failed because the server could not be reached :-( Please wait a bit and then log-in again to overwrite old token!');
			}, function(){
				if (errorCallback) errorCallback('Sorry, but the logout process failed because it seems you are offline :-( Please wait for a connection and then simply log-in again.');
			});
			if (debugCallback) debugCallback(data);
		}
		//call
		$.ajax(request);
	}
	Account.afterLogout = function(){};
	
	//------------- helpers ---------------
	
	//sha256 hash + salt
	Account.pwdHashSalt = "salty1";
	function getSHA256(data){
		return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(data + Account.pwdHashSalt));
	}
	Account.getSHA256 = function(data) { return getSHA256(data); }
	
	//-------------------------------------
	
	return Account;
}