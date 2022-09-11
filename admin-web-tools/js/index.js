//---------App:

var controlHubVersion = "1.5.0";

//---------Skins:

var sepiaControlHubActiveSkin = 0;

function setSepiaControlHubSkin(newIndex, rememberSelection){
	if (newIndex == undefined) newIndex = ByteMind.data.get('activeSkin') || (getPreferredColorScheme() == "light"? 2: 1);
	if (newIndex != sepiaControlHubActiveSkin){
		var homeLogo = document.getElementById("home-logo");
		//set
		var skins = $('.sepiaFW-style-skin');
		var setIndex = 1;
		var setLogo = "img/icon-512-alpha.png";
		if (newIndex <= 1){
			skins.each(function(index){
				$(this).prop('title', '');
				$(this).prop('disabled', true);
			});
			ByteMind.debug.log("UI active skin: default");
		}else{
			skins.each(function(index){
				var id = this.dataset.id;
				var that = this;
				if (id == newIndex){
					$(this).prop('title', 'main');
					$(this).prop('disabled', false);
					ByteMind.debug.log("UI active skin: " + $(this).attr('href'));
					setIndex = id;
					setLogo = this.dataset.logo || "img/icon-512-alpha.png";
				}else{
					$(this).prop('title', '');
					$(this).prop('disabled', true);
				}
			});
		}
		sepiaControlHubActiveSkin = setIndex;
		homeLogo.src = setLogo;
		if (rememberSelection){
			ByteMind.data.set('activeSkin', setIndex);
		}
	}
}
function getPreferredColorScheme(){
	if ('matchMedia' in window){
		if (window.matchMedia('(prefers-color-scheme: dark)').matches){
			return "dark";
		}else if (window.matchMedia('(prefers-color-scheme: light)').matches){
			return "light";
		}
	}
	return "";
}

//---------Pages:

var HOME = "home";
var HOME_TITLE = "S.E.P.I.A. Control HUB";
var HOME_DESC = "The S.E.P.I.A. Control HUB helps you set-up, configure and manage your assistant and servers.";

function buildPages(sideMenuEle){
	
	//Home
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>home</span> Home", {
		sectionName : HOME,
		viewId : "home", 		//use this if you have an ID else use 'view' and give the element
		title : HOME_TITLE,
		headerTitle : ByteMind.local.g('welcome'),
		description : HOME_DESC
	}, sideMenuEle);

	//Server connections
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>account_tree</span> Server Connections", {
		sectionName : "server-connections",
		viewId : "server-connections",
		title : "SEPIA Server Connections Setup",
		headerTitle : "Server Connections",
		description : "Set up your SEPIA server connections and test."
	}, sideMenuEle);

	//Core settings
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>settings</span> Core Settings", {
		sectionName : "core-settings",
		viewId : "core-settings",
		title : "SEPIA Core Settings",
		headerTitle : "Core Settings",
		description : "Configure your SEPIA core server settings."
	}, sideMenuEle);

	//User management
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>people</span> User Management", {
		sectionName : "user-management",
		viewId : "user-management",
		title : "SEPIA User Management",
		headerTitle : "User Management",
		description : "Create and edit SEPIA users."
	}, sideMenuEle);

	//CodeUI
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>code</span> Code-UI", {
		sectionName : "code-ui",
		viewId : "code-ui",
		title : "SEPIA Code UI",
		headerTitle : "SEPIA Code UI",
		description : "SEPIA Code UI to write services and plugins.",
		onPageLoad : function(){
			ByteMind.page.import("code-ui", "code-ui.html", "#page-code-ui", 
				["css/code-ui.css", "lib/codemirror.css", "theme/sepia-fw.css"], 
				["lib/codemirror.js", "mode/clike/clike.js", "js/code-ui.js"], 
				function(ele){
					//Finished loading
					codeUiOnReady(); 	//function of loaded page
				}
			);
		}
	}, sideMenuEle);

	//Smart Home
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>router</span> Smart Home", {
		sectionName : "smart-home",
		viewId : "smart-home",
		title : "Smart Home Configuration",
		headerTitle : "Smart Home",
		description : "Configure your Smart Home to work with SEPIA."
	}, sideMenuEle);
	
	//Assistant
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>question_answer</span> Assistant Testing", {
		sectionName : "assistant",
		viewId : "assistant",
		title : "SEPIA Assistant Testing",
		headerTitle : "Assistant API Testing",
		description : "Test the SEPIA Assistant API and NLU."
	}, sideMenuEle);

	//Answer Manager
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>format_list_numbered</span> Answer Manager", {
		sectionName : "answer-manager",
		viewId : "answer-manager",
		title : "SEPIA Answer-Manager",
		headerTitle : "Answer Manager",
		description : "Answer Manager for SEPIA assistant answers."
	}, sideMenuEle);

	//Speech Recognition
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>settings_voice</span> Speech Recognition", {
		sectionName : "speech-recognition",
		viewId : "speech-recognition",
		title : "SEPIA STT Manager",
		headerTitle : "Speech Recognition",
		description : "Manage your SEPIA STT-Server for speech recogniton."
	}, sideMenuEle);
	
	//Text-to-speech
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>record_voice_over</span> Speech Synthesis", {
		sectionName : "speech-synthesis",
		viewId : "text-to-speech",
		title : "SEPIA TTS Manager",
		headerTitle : "Speech Synthesis",
		description : "Manage your SEPIA TTS module for speech synthesis."
	}, sideMenuEle);

	//Chat Server Settings
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>sms</span> Chat Settings", {
		sectionName : "chat-server-settings",
		viewId : "chat-server-settings",
		title : "SEPIA Chat Server Manager",
		headerTitle : "SEPIA Chat Settings",
		description : "Manage your SEPIA Chat-Server."
	}, sideMenuEle);
	
	//Client Connections
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>settings_remote</span> Client Connections", {
		sectionName : "client-connections",
		viewId : "client-connections",
		title : "SEPIA Client Connections",
		headerTitle : "Client Connections",
		description : "Connect to your SEPIA clients, e.g. via CLEXI server."
	}, sideMenuEle);

	//Performance Tests
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>speed</span> Performance Tests", {
		sectionName : "performance-tests",
		viewId : "performance-tests",
		title : "Performance Testing",
		headerTitle : "Performance Tests",
		description : "Test the SEPIA server performance."
	}, sideMenuEle);

	//Help & Credits
	ByteMind.page.registerSectionWithNavButton("<span class='material-icons'>help_outline</span> Help & Credits", {
		sectionName : "help",
		viewId : "help",
		title : HOME_TITLE,
		headerTitle : "Help & Credits",
		description : HOME_DESC,
	}, sideMenuEle);
	
}

//---------Webservice:

function setupWebserviceClass(){
	//Some required configuration
	ByteMind.webservice.apiURL = "http://localhost:20721";
}

//---------Account:

function setupAccountClass(){
	//Some required account configuration
	ByteMind.account.apiURL = "http://localhost:20721";
	ByteMind.account.tokenValidTime = 1000*60*60*24; 	//refresh of account.userToken required after e.g. 1 day
	if (client_info) ByteMind.config.clientInfo = client_info;
	
	//Request info of LOGIN call
	ByteMind.account.getLoginRequestData = function(userId, pwd, isClearText){
		//hash password?
		if (pwd && isClearText){
			//encrypt
			pwd = ByteMind.account.getSHA256(pwd);
		}
		var requestBody = {
			action: "validate",
			//GUUID: userId,	//<-- DONT USE THAT IF ITS NOT ABSOLUTELY NECESSARY (USE 'KEY') ...
			//PWD: pwd,			//... it sends clear text password (and is a much heavier load for the server!)
			KEY: (userId + ";" + pwd),
			client: ByteMind.config.clientInfo
		}
		var url = (endsWith(ByteMind.account.apiURL, "/sepia"))? 
			(ByteMind.account.apiURL + "/assist") : ByteMind.account.apiURL;		//SEPIA Control HUB MOD.
		var request = {
			url: url + "/authentication",
			timeout: 5000,
			type: "POST",
			data: JSON.stringify(requestBody),
			headers: {
				"content-type": "application/json"
			}
		}
		return request;
	}
	//Success condition for LOGIN call
	ByteMind.account.loginSuccessTest = function(data){
		return (data.result && data.result === "success");
	}
	
	//Request info of LOGOUT call
	ByteMind.account.getLogoutRequestData = function(){
		var account = ByteMind.account.getData() || {};
		var requestBody = {
			action: "logout",
			KEY: (account.userId + ";" + account.userToken),
			client: ByteMind.config.clientInfo
		}
		var url = (endsWith(ByteMind.account.apiURL, "/sepia"))? 
			(ByteMind.account.apiURL + "/assist") : ByteMind.account.apiURL;		//SEPIA Control HUB MOD.
		var request = {
			url: url + "/authentication",
			timeout: 5000,
			type: "POST",
			data: JSON.stringify(requestBody),
			headers: {
				"content-type": "application/json"
			}
		}
		return request;
	}
	//Success condition for LOGOUT call
	ByteMind.account.logoutSuccessTest = function(data){
		return (data.result && data.result === "success");
	}

	//Called during login success to store data (data=login API call answer as JSON).
	//Overwrite as you need, keep left side (e.g. account.userId=...) to retain login logic
	ByteMind.account.storeData = function(data){
		var account = new Object();
		account.userId = data.uid;
		account.userToken = data.keyToken;
		account.userTokenTS = data.keyToken_TS; 		//TODO: use this?
		account.validUntil = data.validUntil;
		account.language = data.user_lang_code;
		account.name = (data.user_name)? data.user_name.nick : "Boss";
		account.roles = data.user_roles;
		//console.log(data);
		//console.log(account);
		return account;
	}
}

//---------Load on start:

//Run just before ByteMind.account tries to restore account data
function beforeLoginRestore(){

	//Get right server
	var locationHost;
	if (location.host.indexOf(":") > 0){
		//local server [IP]:[PORT]
		if (location.pathname.indexOf("/sepia/") >= 0){
			locationHost = location.origin + location.pathname.replace(/\/sepia\/.*/, "/sepia");
		}else if (location.pathname.indexOf("/tools/") >= 0){
			locationHost = location.origin;
		}
	}else if (location.pathname.indexOf("/sepia/assist/tools/") >= 0){
		locationHost = location.origin + location.pathname.replace(/\/assist\/tools\/.*/, "");
	}
	var serverViaUrl = getURLParameter('server');
	var storedAccountUrl = ByteMind.data.get('account-api-url');
	var customServer = appStorage.getItem('customServer');
	//choose:	
	var customHost = customServer || serverViaUrl || storedAccountUrl || locationHost;
	if (customHost){
		//fix some potential input errors
		customHost = handleCommonHosts(customHost);
		updateHostServer(customHost);
	}

	/* var server = appStorage.getItem('server');
	if (server){
		server_select.value = server;
	} */
	var customClient = appStorage.getItem('customClient');
	if (customClient){
		$('#custom-client').val(customClient);
		ByteMind.config.clientInfo = customClient;
	}

	//Store host and build all other API URLs as good as we can
	window.addEventListener("bm-account-new-api-url", function(e){ 
		var host = e.detail.url;
		if (host){
			host = handleCommonHosts(host);
			ByteMind.data.set('account-api-url', host);
			$('#server').val(host);
			appStorage.setItem('customServer', host); 	//do it?
			updateHostServer(host);
		}
	});

	//Transfer login data to shared.js
	ByteMind.account.afterLogin = function(){
		login(function(data){
			//on success - set fields
			if (userid){
				$('#id').val(userid);
			}
			if (key){
				$('#pwd').val(key);
				updatePasswordSecurityWarning();
			}
			//observe 'validUntil' field
			if (data && data.validUntil){
				var timeLeft = data.validUntil - Date.now();
				if (timeLeft >= 0){
					console.log("Login still valid for: " + timeLeft);
					$('#bytemind-account-btn').removeClass("expired");
					setTimeout(function(){
						console.error("Login expired, please reload app!");
						$('#pwd').val("");
						$('#bytemind-account-btn').addClass("expired");
						updatePasswordSecurityWarning();
					}, timeLeft);
				}else{
					$('#bytemind-account-btn').addClass("expired");
				}
			}
		});
	}

	//Clean-up after logout
	ByteMind.account.afterLogout = function(){
		$('#bytemind-login-box').hide();
		//clean up custom server
		$('#server').val("");
		appStorage.setItem('customServer', "");
		//TODO: remove more data like host?
		
		//reload pop-up
		ByteMind.ui.showPopup(ByteMind.local.g('done'), {
			buttonOneName : ByteMind.local.g('refreshUI'),
			buttonOneAction : function(){
				window.location.reload(true);
			}
		});
	}
}

//Last action after initialization
function onStart(){
	//--- restore skin ---
	
	setSepiaControlHubSkin();

	//--- session variables ---

	var assistServer = appStorage.getItem('assistServer');
	if (assistServer){
		$('#assist-server').val(assistServer);
	}
	var teachServer = appStorage.getItem('teachServer');
	if (teachServer){
		$('#teach-server').val(teachServer);
	}
	var chatServer = appStorage.getItem('chatServer');
	if (chatServer){
		$('#chat-server').val(chatServer);
	}
	var meshNodeServer = appStorage.getItem('meshNodeServer');
	if (meshNodeServer){
		$('#mesh-node-server').val(meshNodeServer);
	}

	smartHomeOnStart();

	sttServer = appStorage.getItem('sttServer');
	if (sttServer){
		$('#stt-server').val(sttServer);
	}else{
		var serverViaUrl = getURLParameter('stt-server');
		if (serverViaUrl){
			$('#stt-server').val(serverViaUrl);
		}
	}
	
	clientConnectionsOnStart();

	//--- Page: assistant, answer-manager, speech-rec. ---

	//build assistant stuff
	$('#assist-language-select').html(buildLanguageSelectorOptions());
	$('#remote-action-type-sel').html(buildRemoteActionTypeSelectorOptions()).on('change', onRemoteActionTypeChange);
	
	//build answer-manager stuff
	$('#answer-manager-lang-sel').html(buildLanguageSelectorOptions());
	
	//build speech-recognition stuff
	$('#stt-language-select').html(buildLanguageSelectorOptions());

	//--- global elements ---

	//make results view draggable
	makeDraggable('result-container', 'result-drag-btn');
	
	//activate postMessage interface
	sepiaPostMessageInterfaceReady = true;
	releaseBufferedSepiaPostMessages();
}

//------ Post-Message Interface ------

var sepiaPostMessageInterfaceReady = false;
var sepiaPostMessageInterfaceBuffer = [];
var sepiaPostMessageHandlers = {
	"test": 	console.log,
	"login": 	accountPostMessageHandlerLogin 	//authentication.js
}
function addPostMessageHandler(handlerName, handlerFun){
	sepiaPostMessageHandlers[handlerName] = handlerFun;
}
function releaseBufferedSepiaPostMessages(){
	sepiaPostMessageInterfaceBuffer.forEach(function(data){
		var handler = sepiaPostMessageHandlers[data.fun];
		if (handler && typeof handler == "function"){
			handler(data.ev);
		}else{
			console.error('SEPIA - sendInputEvent of ' + data.source + ': Message handler not available!');
		}
	});
}
window.addEventListener('message', function(message){
	if (message.data && message.data.type){
		if (message.data.type == "sepia-common-interface-event"){
			//console.log(message);
			console.log("SEPIA Control HUB received message for handler: " + message.data.fun);
			if (sepiaPostMessageInterfaceReady){
				var handler = sepiaPostMessageHandlers[message.data.fun];
				if (handler && typeof handler == "function"){
					handler(message.data.ev);
				}else{
					console.error('SEPIA - sendInputEvent of ' + message.source + ': Message handler not available!');
				}
			}else{
				sepiaPostMessageInterfaceBuffer.push({
					fun: message.data.fun,
					ev: message.data.ev,
					source: message.source
				});
			}
		}
	}
});
//Example: iframe.contentWindow.postMessage({type: "sepia-common-interface-event", fun:"test", ev: "Hello"}, "*");
//postMessage to parent window
/*
function parentPostMsg(msg){
	//post only if really a child
	if (window !== parent){
		parent.postMessage(msg, "*");
	}
}
*/
if (window !== parent){
	console.log("SEPIA Control HUB loaded inside frame. PostMessage interface available.");
}

//------ more globals ------

//fix some potential input errors
function handleCommonHosts(customHost){
	if (customHost == "localhost" || endsWith(customHost, ".local") || !!customHost.match(/\.\d{1,3}$/)){
		customHost += ":20721";
	}
	if (customHost.indexOf("http") != 0){
		if (endsWith(customHost, "/sepia/") || endsWith(customHost, "/sepia")){
			customHost = "https://" + customHost; 		//assume HTTPS
		}else{
			customHost = "http://" + customHost;
		}
	}
	return customHost;
}

//update host and servers
function updateHostServer(customHost){
	customHost = customHost.replace(/\/$/,"").trim();
	ByteMind.debug.info("Set custom host: " + customHost);
	//Proxy?
	if (endsWith(customHost, "/sepia")){
		ByteMind.account.apiURL = customHost;
		ByteMind.webservice.apiURL = customHost;
	//Direct links
	}else{
		ByteMind.account.apiURL = customHost.replace(/\/sepia\/.*/, "/sepia").trim();
		ByteMind.webservice.apiURL = customHost.replace(/\/sepia\/.*/, "/sepia").trim();
	}
	$('#server').val(customHost);
	$('#bytemind-login-host-name').val(ByteMind.account.apiURL);
	//Update all connections
	if (endsWith(ByteMind.account.apiURL, "/sepia")){
		$('#assist-server').attr('placeholder', ByteMind.account.apiURL + "/assist");
		$('#teach-server').attr('placeholder', ByteMind.account.apiURL + "/teach");
		$('#chat-server').attr('placeholder', ByteMind.account.apiURL + "/chat");
	}else if (endsWith(ByteMind.account.apiURL, ":20721")){
		$('#assist-server').attr('placeholder', ByteMind.account.apiURL);
		$('#teach-server').attr('placeholder', ByteMind.account.apiURL.replace(/\d+$/,"20722"));
		$('#chat-server').attr('placeholder', ByteMind.account.apiURL.replace(/\d+$/,"20723"));
	}
}

function resultBoxHide(){
	$('#result-container').hide();
}
