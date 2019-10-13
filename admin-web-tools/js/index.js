//---------App:

var controlHubVersion = "1.2.2";

//---------Pages:

var HOME = "home";
var HOME_TITLE = "S.E.P.I.A. Control HUB";
var HOME_DESC = "The S.E.P.I.A. Control HUB helps you set-up, configure and manage your assistant and servers.";

function buildPages(sideMenuEle){
	
	//Home
	ByteMind.page.registerSectionWithNavButton("Home", {
		sectionName : HOME,
		viewId : "home", 		//use this if you have an ID else use 'view' and give the element
		title : HOME_TITLE,
		headerTitle : ByteMind.local.g('welcome'),
		description : HOME_DESC
	}, sideMenuEle);

	//Server connections
	ByteMind.page.registerSectionWithNavButton("Server Connections", {
		sectionName : "server-connections",
		viewId : "server-connections",
		title : "SEPIA Server Connections Setup",
		headerTitle : "Server Connections",
		description : "Set up your SEPIA server connections and test."
	}, sideMenuEle);

	//Core settings
	ByteMind.page.registerSectionWithNavButton("Core Settings", {
		sectionName : "core-settings",
		viewId : "core-settings",
		title : "SEPIA Core Settings",
		headerTitle : "Core Settings",
		description : "Configure your SEPIA core server settings."
	}, sideMenuEle);

	//User management
	ByteMind.page.registerSectionWithNavButton("User Management", {
		sectionName : "user-management",
		viewId : "user-management",
		title : "SEPIA User Management",
		headerTitle : "User Management",
		description : "Create and edit SEPIA users."
	}, sideMenuEle);

	//CodeUI
	ByteMind.page.registerSectionWithNavButton("Code-UI", {
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
	ByteMind.page.registerSectionWithNavButton("Smart Home", {
		sectionName : "smart-home",
		viewId : "smart-home",
		title : "Smart Home Configuration",
		headerTitle : "Smart Home",
		description : "Configure your Smart Home to work with SEPIA."
	}, sideMenuEle);
	
	//Assistant
	ByteMind.page.registerSectionWithNavButton("Assistant Testing", {
		sectionName : "assistant",
		viewId : "assistant",
		title : "SEPIA Assistant Testing",
		headerTitle : "Assistant API Testing",
		description : "Test the SEPIA Assistant API and NLU."
	}, sideMenuEle);

	//Answer Manager
	ByteMind.page.registerSectionWithNavButton("Answer Manager", {
		sectionName : "answer-manager",
		viewId : "answer-manager",
		title : "SEPIA Answer-Manager",
		headerTitle : "Answer Manager",
		description : "Answer Manager for SEPIA assistant answers."
	}, sideMenuEle);

	//Speech Recognition
	ByteMind.page.registerSectionWithNavButton("Speech Recognition", {
		sectionName : "speech-recognition",
		viewId : "speech-recognition",
		title : "SEPIA STT Manager",
		headerTitle : "Speech Recognition",
		description : "Manage your SEPIA STT-Server for speech recogniton."
	}, sideMenuEle);

	//Chat Server Settings
	ByteMind.page.registerSectionWithNavButton("Chat Settings", {
		sectionName : "chat-server-settings",
		viewId : "chat-server-settings",
		title : "SEPIA Chat Server Manager",
		headerTitle : "SEPIA Chat Settings",
		description : "Manage your SEPIA Chat-Server."
	}, sideMenuEle);

	//Performance Tests
	ByteMind.page.registerSectionWithNavButton("Performance Tests", {
		sectionName : "performance-tests",
		viewId : "performance-tests",
		title : "Performance Testing",
		headerTitle : "Performance Tests",
		description : "Test the SEPIA server performance."
	}, sideMenuEle);

	//Help & Credits
	ByteMind.page.registerSectionWithNavButton("Help & Credits", {
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
		locationHost = location.origin;
	}
	var serverViaUrl = getURLParameter('server');
	var storedAccountUrl = ByteMind.data.get('account-api-url');
	var customServer = sessionStorage.getItem('customServer');
	//choose:	
	var customHost = customServer || serverViaUrl || storedAccountUrl || locationHost;
	if (customHost){
		//fix some potential input errors
		customHost = handleCommonHosts(customHost);
		updateHostServer(customHost);
	}

	/* var server = sessionStorage.getItem('server');
	if (server){
		server_select.value = server;
	} */
	var customClient = sessionStorage.getItem('customClient');
	if (customClient){
		$('#custom-client').val(customClient);
	}

	//Store host and build all other API URLs as good as we can
	window.addEventListener("bm-account-new-api-url", function(e){ 
		var host = e.detail.url;
		if (host){
			host = handleCommonHosts(host);
			ByteMind.data.set('account-api-url', host);
			$('#server').val(host);
			sessionStorage.setItem('customServer', host); 	//do it?
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
		});
	}

	//Clean-up after logout
	ByteMind.account.afterLogout = function(){
		$('#bytemind-login-box').hide();
		//clean up custom server
		$('#server').val("");
		sessionStorage.setItem('customServer', "");
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

	//--- session variables ---

	var assistServer = sessionStorage.getItem('assistServer');
	if (assistServer){
		$('#assist-server').val(assistServer);
	}
	var teachServer = sessionStorage.getItem('teachServer');
	if (teachServer){
		$('#teach-server').val(teachServer);
	}
	var chatServer = sessionStorage.getItem('chatServer');
	if (chatServer){
		$('#chat-server').val(chatServer);
	}
	var meshNodeServer = sessionStorage.getItem('meshNodeServer');
	if (meshNodeServer){
		$('#mesh-node-server').val(meshNodeServer);
	}

	smartHomeSystem = sessionStorage.getItem('smartHomeSystem');
	if (smartHomeSystem){
		$('#smarthome_system_select').val(smartHomeSystem);
	}
	smartHomeServer = sessionStorage.getItem('smartHomeServer');
	if (smartHomeServer){
		$('#smarthome-server').val(smartHomeServer);
	}else{
		var serverViaUrl = getURLParameter('smarthome-server');
		if (serverViaUrl){
			$('#smarthome-server').val(serverViaUrl);
		}
	}

	sttServer = sessionStorage.getItem('sttServer');
	if (sttServer){
		$('#stt-server').val(sttServer);
	}else{
		var serverViaUrl = getURLParameter('stt-server');
		if (serverViaUrl){
			$('#stt-server').val(serverViaUrl);
		}
	}

	//--- Page: assistant, answer-manager ---

	//build assistant stuff
	$('#assist-language-select').html(buildLanguageSelectorOptions());
	$('#remote-action-type-sel').html(buildRemoteActionTypeSelectorOptions()).on('change', onRemoteActionTypeChange);
	
	//build answer-manager stuff
	$('#answer-manager-lang-sel').html(buildLanguageSelectorOptions());

	//--- global elements ---

	//make results view draggable
	makeDraggable('result-container', 'result-drag-btn');
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

//update host ander servers
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