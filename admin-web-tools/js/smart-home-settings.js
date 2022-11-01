//------ INTERFACE: ------

var smartHomeSystem = "";
var smartHomeServer = "";
var smartHomeSystemLoaded = "";
var smartHomeServerLoaded = "";
var smartHomeCustomInterfaces;
var smartHomeCustomInterfaceTypes;

var smartHomeInterfaceAuthTypes = [
	{value: "Basic", name: "Basic"},
	{value: "Bearer", name: "Bearer/Token"},
	{value: "Plain", name: "Plain/Custom"}
];

var SEPIA_TAG_NAME = "sepia-name";
var SEPIA_TAG_TYPE = "sepia-type";
var SEPIA_TAG_ROOM = "sepia-room";
var SEPIA_TAG_ROOM_INDEX = "sepia-room-index";
var SEPIA_TAG_DATA = "sepia-data";
var SEPIA_TAG_MEM_STATE = "sepia-mem-state";
var SEPIA_TAG_STATE_TYPE = "sepia-state-type";
var SEPIA_TAG_SET_CMDS = "sepia-set-cmds";

var SEPIA_TAG_INTERFACE = "sepia-interface";
var SEPIA_TAG_INTERFACE_DEVICE_ID = "sepia-interface-device-id";
var SEPIA_TAG_INTERFACE_CONFIG = "sepia-interface-config";
var SEPIA_TAG_LINK = "sepia-link";

//TODO: rename
var smartHomeShowHidden = false;	//state of show/hide button, starts with false
var smartHomeRefreshDelayTimer;		//timer that automatically refreshes stuff after change by user
var smartHomeRefreshDelayInterval;	//interval for timer
var newSmartHomeDeviceCounter = 1;

function smartHomeOnStart(){
	smartHomeSystem = appStorage.getItem('smartHomeSystem');
	if (smartHomeSystem){
		smartHomeSystemOnChange(smartHomeSystem);
	}
	smartHomeServer = appStorage.getItem('smartHomeServer');
	if (smartHomeServer){
		$('#smarthome-server').val(smartHomeServer);
	}else{
		var serverViaUrl = getURLParameter('smarthome-server');
		if (serverViaUrl){
			$('#smarthome-server').val(serverViaUrl);
		}
	}
	//change listener
	$('#smarthome_system_select').on('change', function(){
		smartHomeSystemOnChange(this.value);
	});
}
function smartHomeSystemOnChange(smartHomeSys){
	if (!smartHomeSys) smartHomeSys = "";
	var isKnown = hasSelectedKnownSmartHomeSystem(smartHomeSys);
	if (smartHomeSys != "custom" && isKnown){
		$('#smarthome_system_select').val(smartHomeSys);
		$('#smarthome_system_custom').hide(300);
		//$('#smarthome-server').addClass("disabled").attr("disabled", true);		
	}else{
		$('#smarthome_system_select').val('custom');
		$('#smarthome_system_custom_select').val(smartHomeSys);
		$('#smarthome_system_custom').show(300);
		//$('#smarthome-server').removeClass("disabled").attr("disabled", false);
	}
	smartHomeSystem = smartHomeSys;
	if (!isKnown || smartHomeSystemSupportsCustomCards(smartHomeSys)){
		$('#smarthome-devices-create').show(300);
		$('#smarthome-interfaces-manage').show(300);
	}else{
		$('#smarthome-devices-create').hide(300);
		$('#smarthome-interfaces-manage').hide(300);
	}
	if (!isKnown || smartHomeSystemRequiresRegistration(smartHomeSys)){
		$('#smarthome-hub-register').show(300);
	}else{
		$('#smarthome-hub-register').hide(300);
	}
	if (isKnown && smartHomeSystemCanSkipAuthData(smartHomeSys)){
		$('#smarthome-hub-auth-data-pop-btn').hide(300);
	}else{
		if (smartHomeSystemLoaded) $('#smarthome-hub-auth-data-pop-btn').show(300);
	}
}

function hasSelectedKnownSmartHomeSystem(sys){
	var isOption = false;
	sys = sys.toLowerCase();
	$('#smarthome_system_select option').each(function(){
		if (this.value.toLowerCase() == sys) {
			isOption = true;
			return false;
		}
	});
	return isOption;
}
function smartHomeSystemRequiresRegistration(sys){
	return (sys.toLowerCase() == "fhem" || sys.toLowerCase() == "custom" || sys.toLowerCase() == "test");
}
function smartHomeSystemCanSkipAuthData(sys){
	return (sys.toLowerCase() == "internal");
}
function smartHomeSystemSupportsCustomCards(sys){
	return (sys.toLowerCase() == "internal" || sys.toLowerCase() == "custom");
}

function getSmartHomeSystem(){
	var system = $('#smarthome_system_select').val();
	if (system == "custom"){
		$('#smarthome_system_custom').show();
		system = $('#smarthome_system_custom_select').val();
	}
	if (system){
		appStorage.setItem('smartHomeSystem', system);
		smartHomeSystem = system;
	}else{
		appStorage.setItem('smartHomeSystem', "");
	}
	return system;
}
function getSmartHomeServer(successCallback, errorCallback){
	var host = $('#smarthome-server').val();
	if (host){
		appStorage.setItem('smartHomeServer', host);
		smartHomeServer = host;
		if (successCallback) successCallback(host);
	}else{
		appStorage.setItem('smartHomeServer', "");
		smartHomeServer = "";
		if (errorCallback) errorCallback();
	}
	return host;
}
function btnGetSmartHomeHubData(){
	$('#smarthome-devices-filter').val("");		//reset filter
	getSmartHomeHubDataFromServer();
}
function getSmartHomeHubDataFromServer(successCallback, errorCallback){
	var body = {};
	smartHomeClearRefreshTimer();
	genericPostRequest("assist", "integrations/smart-home/getConfiguration", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log("getSmartHomeHubDataFromServer", data);
			data.hubName = data.hubName;
			smartHomeSystemOnChange(data.hubName);
			$('#smarthome-server').val(data.hubHost);
			//remember loaded ones
			smartHomeSystemLoaded = data.hubName || "";
			smartHomeServerLoaded = data.hubHost;
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			if (!smartHomeSystemCanSkipAuthData(smartHomeSystemLoaded)){
				$('#smarthome-hub-auth-data-pop-btn').show(300);
			}
			//load interfaces too
			loadSmartHomeCustomInterfaces(successCallback, errorCallback);
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			if (errorCallback) errorCallback();
		}
	);
}
function writeSmartHomeHubDataToServer(authType, authData){
	var hubName = $("#smarthome_system_select").val();
	if (hubName == "custom"){
		hubName = $('#smarthome_system_custom_select').val();
	}
	var host = $("#smarthome-server").val();
	if (!host){
		if (hubName == "internal"){
			host = "SEPIA";
		}else if (hubName == "test"){
			host = "http://localhost:8083/myTest";
		}
	}
	if (host && hubName){
		smartHomeSystemLoaded = hubName;
		smartHomeServerLoaded = host;
		var d = [{
			smarthome_hub_name: hubName
		},{
			smarthome_hub_host: host
		}];
		//add auth data?
		if (authType != undefined && authData != undefined){
			d.push({smarthome_hub_auth_type: authType});
			d.push({smarthome_hub_auth_data: authData});
		}
		var body = {
			"setConfig": JSON.stringify(d)
		};
		serverConfigRequest(body, function(){
			//success
			appStorage.setItem('smartHomeSystem', smartHomeSystemLoaded);
			appStorage.setItem('smartHomeServer', smartHomeServerLoaded);
			$("#smarthome_system_select").trigger("change");
			softRestartServer();
			ByteMind.ui.showPopup("The server is restarting to load the new settings, please wait a few seconds then press 'Load HUB info' again to see if changes took effect!");
		});
	}else{
		ByteMind.ui.showPopup("Please select HUB and set server host address first.");
	}
}
function loadSmartHomeCustomInterfaces(successCallback, errorCallback){
	var body = {};
	smartHomeClearRefreshTimer();
	genericPostRequest("assist", "integrations/smart-home/getInterfaces", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log("loadSmartHomeCustomInterfaces", data);
			smartHomeCustomInterfaces = data.interfaces;
			smartHomeCustomInterfaceTypes = data.types;
			//refresh all existing select elements
			updateAllSmartHomeCustomHubSelectors();
			//done
			if (successCallback) successCallback(data);
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			if (errorCallback) errorCallback(data);
		}
	);
}
function findSmartHomeInterface(interfaceId){
	if (!smartHomeCustomInterfaces || smartHomeCustomInterfaces.length == 0){
		return;
	}else{
		var foundShInt;
		for (var i=0; i<smartHomeCustomInterfaces.length; i++){
			var shInt = smartHomeCustomInterfaces[i];
			if (shInt.id == interfaceId){
				foundShInt = shInt;
				break;
			}
		}
		return foundShInt;
	}
}

function showSmartHomeAccessCredentialsPopup(){
	var content = document.createElement("div");
	content.innerHTML = sanitizeHtml("<h3>Smart Home HUB Authorization</h3>" +
		"<p class='info-text'>Set or overwrite authorization type and data for external smart-home HUB.</p>" + 
		"<p class='info-text'>NOTE: <b>Basic</b> authorization usually requires base64-encoded 'username:password'.</p>" +
		"<div style='display: flex; flex-direction: column;'>" + 
			"<label>Authorization Type:</label>" + 
				"<select id='smarthome-auth-type'>" + buildSmartHomeInterfaceAuthTypeOptions() + "</select>" +
			"<label>Data (token, password, etc.):</label>" + 
				"<input id='smarthome-auth-data' spellcheck='false' placeholder='username:password or token ...'>" + 
			"</div>" +
		"</div>"
	);
	var $content = $(content);
	var $authTypeEle = $content.find('#smarthome-auth-type');
	var $authDataEle = $content.find('#smarthome-auth-data');
	var authType = "";
	var authData = "";
	var preEncodeData = "";
	var config = {
		useSmallCloseButton: false,
		buttonOneName: "Write",
		buttonOneAction: function(){
			//write all
			writeSmartHomeHubDataToServer(authType, authData);
			//ByteMind.ui.hidePopup();
		},
		buttonTwoName: "Abort",
		buttonTwoAction: function(){},
		buttonThreeName: "Encode/Decode",
		buttonThreeAction: function(){
			if (authData){
				if (!preEncodeData){
					preEncodeData = authData;
					authData = btoa(authData);
				}else{
					authData = preEncodeData;
					preEncodeData = "";
				}
				$authDataEle.val(authData);
			}
		}
	}
	ByteMind.ui.showPopup(content, config);
	//type
	$authTypeEle.on('change', function(){
		authType = this.value;
	});
	//data
	$authDataEle.on('change', function(){
		authData = this.value;
		preEncodeData = "";
	});
}

function manageSmartHomeInternalInterfaces(skipLoad){
	if (!skipLoad && (!smartHomeSystemLoaded || !smartHomeCustomInterfaces)){
		getSmartHomeHubDataFromServer(function(){
			manageSmartHomeInternalInterfaces(true);
		});
		return;
	}
	var content = document.createElement("div");
	content.innerHTML = sanitizeHtml("<h3>Smart Home HUB Interfaces</h3>" +
		"<p class='info-text'>Here you can manage interfaces for the internal SEPIA HUB.</p>" +
		"<div style='display: flex; flex-direction: column;'>" + 
			"<label>Select or create new:</label>" + 
			"<div style='min-width: 196px; display: flex; justify-content: center; align-items: center;'>" + 
				"<select class='smarthome-item-interface' style='width: calc(100% - 42px); min-width: auto;'" + SEPIA_TAG_INTERFACE + "'>" +
					buildSmartHomeCustomHubOptions() +
				"</select>" + 
				"<button style='width: 34px; min-width: auto; margin: 8px 2px;' class='smarthome-item-interface-edit'><i class='material-icons md-txt'>edit</i></button>" + 
			"</div>" + 
		"</div>"
	);
	var $content = $(content);
	var config = {
		useSmallCloseButton: true
	}
	ByteMind.ui.showPopup(content, config);
	//interface edit
	$content.find('.smarthome-item-interface-edit').on('click', function(){
		var shInterface = $content.find('.smarthome-item-interface').val();
		if (shInterface){
			buildSmartHomeInterfaceEditor(findSmartHomeInterface(shInterface));
		}else{
			buildSmartHomeInterfaceEditor();
		}
	});
}

//item methods

function getSmartHomeItemMetaData(item, fieldName, asObject){
	var val = item.meta[fieldName];
	if (val && typeof val == "object"){
		if (asObject){
			return val;
		}else{
			val = JSON.stringify(val);
			return val;
		}
	}else if (!val){
		if (asObject){
			return undefined;
		}else{
			return "";
		}
	}else if (!asObject && typeof val == "string"){
		return val;
	}
}

//other methods

function getSmartHomeDevices(successCallback, errorCallback){
	if (smartHomeSystemLoaded && smartHomeServerLoaded){
		smartHomeSystemOnChange(smartHomeSystemLoaded);
		$('#smarthome-server').val(smartHomeServerLoaded);
	}else{
		getSmartHomeHubDataFromServer(function(){
			getSmartHomeDevices(successCallback, errorCallback);
		}, errorCallback);
		return;
	}
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}else{
		smartHomeClearRefreshTimer();
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		deviceTypeFilter: $('#smarthome-devices-filter').val()
	};
	//keep offline cards (not stored in server yet)
	var offlineOnlyCards = $('#smarthome-devices-list').find(".smarthome-item.offline").detach();
	//request
	genericPostRequest("assist", "integrations/smart-home/getDevices", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log("getSmartHomeDevices", data);
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			$('#smarthome-devices-last-refresh').html('- last refresh:<br>' + 
				'<button onclick="refreshSmartHomeDevices();">' + new Date().toLocaleTimeString() + ' <i class="material-icons md-btn" style="vertical-align:bottom;">refresh</i></button>'
			);
			var devices = data.devices;
			var hiddenDevices = 0;
			if (devices && devices.length > 0){
				//sort
				devices.sort(function(a, b){	//TODO: can we sort them before? (server-side?)
					if (a.name > b.name) return 1;
					else if (a.name < b.name) return -1;
					else return 0;
				});
				//build DOM objects
				$('#smarthome-devices-list').html("");
				devices.forEach(function(item){
					var domObj = buildSmartHomeItem(item);
					if (domObj){
						var isHidden = item.type == "hidden";
						addSmartHomeItemToDom(domObj, isHidden, smartHomeShowHidden);
						if (isHidden){
							hiddenDevices++;
						}
					}
				});
				//add change listeners etc.
				$('.smarthome-item').each(function(n, itm){
					addSmartHomeItemListeners(itm);
					activateSmartHomeItem(itm, true);
				});
				//hidden items?
				if (hiddenDevices > 0){
					var showHiddenBtn = document.createElement("button");
					showHiddenBtn.id = "smarthome-devices-list-show-hidden-btn";
					var updateBtnText = function(){
						if (!smartHomeShowHidden){
							showHiddenBtn.innerHTML = "Show " + hiddenDevices + " hidden devices";
						}else{
							showHiddenBtn.innerHTML = "Hide " + hiddenDevices + " hidden devices";
						}
					}
					updateBtnText();
					$('#smarthome-devices-list').append(showHiddenBtn);
					$(showHiddenBtn).on('click', function(){
						$('.smarthome-item.hidden').toggle();
						smartHomeShowHidden = !smartHomeShowHidden;
						updateBtnText();
					});
				}
				//re-attach unfinished cards
				if (offlineOnlyCards && offlineOnlyCards.length > 0){
					offlineOnlyCards.prependTo('#smarthome-devices-list');
				}
			}else{
				//alert("No devices found.");
				$('#smarthome-devices-list').html(
					"<h3 class='smarthome-devices-list-info text-accent' style='width: 100%; margin-bottom: 32px;'>" + 
					"No devices found.</h3>"
				);
				//re-attach unfinished cards
				if (offlineOnlyCards && offlineOnlyCards.length > 0){
					offlineOnlyCards.appendTo('#smarthome-devices-list');
				}
			}
			if (successCallback) successCallback(devices);
		},
		function (data){
			//alert("No items found or no access to smart home system.");
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			$('#smarthome-devices-list').html(
				"<h3 class='smarthome-devices-list-info' style='color: #f00; width: 100%; margin-bottom: 32px;'>" + 
				"Failed to access smart home system.</h3>"
			);
			//re-attach unfinished cards
			if (offlineOnlyCards && offlineOnlyCards.length > 0){
				offlineOnlyCards.appendTo('#smarthome-devices-list');
			}
			if (errorCallback) errorCallback(data);
		}
	);
}
function getSmartHomeDevicesForHub(interfaceId, typeFilter, successCallback, errorCallback){
	if (!interfaceId && interfaceId !== 0){
		showMessage('Error: missing HUB interface ID');
		return;
	}
	var body = {
		hubInterfaceId: interfaceId,
		deviceTypeFilter: typeFilter || null
	};
	//request
	genericPostRequest("assist", "integrations/smart-home/getDevices", body,
		function (data){
			console.log("getSmartHomeDevicesForHub", data);
			if (successCallback) successCallback(data.devices);
		},
		function (err){
			console.error("getSmartHomeDevicesForHub - not found or no access", err);
			//alert("No items found or no access to smart home system.");
			if (errorCallback) errorCallback(err);
		}
	);
}

function refreshSmartHomeDevices(changedDevices){
	//TODO: improve and use 'changedDevices' array
	//		maybe let user select if refresh is: onEvent, onTime, manually ?
	smartHomeClearRefreshTimer();
	if (changedDevices){
		var delayTime = 5000;
		var currentTime = delayTime;
		var $interval = $('#smarthome-refresh-timer');
		$interval.show(300).text(Math.round(currentTime/1000));
		smartHomeRefreshDelayTimer = setTimeout(function(){
			smartHomeClearRefreshTimer();
			getSmartHomeDevices();
		}, delayTime);
		smartHomeRefreshDelayInterval = setInterval(function(){
			currentTime = currentTime - 1000;
			$interval.text(Math.round(currentTime/1000));
		}, 1000);
	}else{
		getSmartHomeDevices();
	}
}
function smartHomeClearRefreshTimer(){
	clearTimeout(smartHomeRefreshDelayTimer);
	clearInterval(smartHomeRefreshDelayInterval);
	$('#smarthome-refresh-timer').hide(150);
}

function registerSepiaInsideSmartHomeHub(){
	//$('#smarthome-devices-list').html("");
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}else{
		smartHomeClearRefreshTimer();
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost
	};
	genericPostRequest("assist", "integrations/smart-home/registerFramework", body,
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			//console.log("registerSepiaInsideSmartHomeHub", data);
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
		}
	);
}

function putSmartHomeItemProperty(shi, property, value, successCallback, errorCallback){
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}else{
		smartHomeClearRefreshTimer();
	}
	var attribs = {};
	attribs[property] = value;
	//refresh smart home item object
	var orgName = shi.name;
	refreshSmartHomeItemProperty(shi, property, value);
	//build request
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		device: shi,
		attributes: attribs
	};
	genericPostRequest("assist", "integrations/smart-home/setDeviceAttributes", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			//console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			console.log("Smart home item: " + orgName + ", changed '" + property + "' to: " + value);
			//refresh UI
			var changedDevices = [];
			changedDevices.push(shi);
			refreshSmartHomeDevices(changedDevices);
			//done
			if (successCallback) successCallback(shi);
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			var msg = "Smart home item: " + orgName + ", FAILED to change '" + property + "' to: " + value;
			console.error(msg);
			//alert(msg);
			if (errorCallback) errorCallback();
		}
	);
}
function refreshSmartHomeItemProperty(shi, property, value){
	//NOTE: value is always a String at this point (sinve its an dom field value)
	switch(property) {
		case SEPIA_TAG_NAME:
			shi.name = value;
			break;
		case SEPIA_TAG_TYPE:
			shi.type = value;
			break;
		case SEPIA_TAG_ROOM:
			shi.room = value;
			break;
		case SEPIA_TAG_ROOM_INDEX:
			shi.roomIndex = value;
			break;
		case SEPIA_TAG_STATE_TYPE:
			shi.stateType = value;
			break;
		case SEPIA_TAG_SET_CMDS:
			shi.meta["setCmds"] = (value? JSON.parse(value) : {});
			break;
		case SEPIA_TAG_INTERFACE:
			shi.interface = value;
			break;
		case SEPIA_TAG_INTERFACE_DEVICE_ID:
			shi.meta["interfaceDeviceId"] = value;
			break;
		case SEPIA_TAG_INTERFACE_CONFIG:
			shi.meta["interfaceConfig"] = (value? JSON.parse(value) : {});
			break;
		case SEPIA_TAG_LINK:
			shi.link = value;
			break;
		default:
			console.error("Smart Home Device property unknown: " + property);
	}
}
function deleteSmartHomeItemProperty(shi, property, successCallback, errorCallback){
	//TODO: for now we just set value to empty
	putSmartHomeItemProperty(shi, property, "", successCallback, errorCallback);
}

function storeSmartHomeItem(shi, successCallback, errorCallback){
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName || !shi){
		showMessage('Error: missing HUB server, host address OR device data');
		if (errorCallback) errorCallback();
		return;
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		device: shi
	};
	genericPostRequest("assist", "integrations/smart-home/createDevice", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			//refresh attributes
			if (data && data.data){
				shi.meta["id"] = data.data.id;
			}
			console.log("Created smart home item: " + shi.name + " with ID: " + shi.meta.id);
			//refresh UI
			/*
			var changedDevices = [];
			changedDevices.push(shi);
			refreshSmartHomeDevices(changedDevices);
			*/
			//done
			if (successCallback) successCallback();
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			var msg = "Could not create smart home item: " + shi.name;
			console.error(msg);
			//alert(msg);
			if (errorCallback) errorCallback();
		}
	);
}
function deleteSmartHomeItem(shi, successCallback, errorCallback){
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	var deviceId = (shi && shi.meta)? shi.meta.id : "";
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		if (errorCallback) errorCallback();
		return;
	}
	if (!deviceId){
		showMessage('Error: missing device ID. Was the device stored already?');
		if (errorCallback) errorCallback();
		return;
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		id: deviceId
	};
	genericPostRequest("assist", "integrations/smart-home/removeDevice", body,
		function (data){
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			//showMessage(JSON.stringify(data, null, 2));
			console.log("Removed smart home item: " + shi.name + " with ID: " + shi.meta.id);
			if (successCallback) successCallback();
		},
		function (data){
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			showMessage(JSON.stringify(data, null, 2));
			var msg = "Could not remove smart home item: " + shi.name;
			console.error(msg);
			//alert(msg);
			if (errorCallback) errorCallback();
		}
	);
}
function createOrUpdateSmartHomeInterface(interf, successCallback, errorCallback){
	if (!interf){
		showMessage('Error: missing HUB interface data');
		if (errorCallback) errorCallback();
		return;
	}
	var body = {
		"interface": interf
	};
	genericPostRequest("assist", "integrations/smart-home/createOrUpdateInterface", body,
		function (data){
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			//showMessage(JSON.stringify(data, null, 2));
			console.log("Created smart home interface: " + data.id);
			if (successCallback) successCallback();
		},
		function (data){
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			showMessage(JSON.stringify(data, null, 2));
			var msg = "Could not create smart home interface: " + interf.id;
			console.error(msg);
			//alert(msg);
			if (errorCallback) errorCallback();
		}
	);
}
function deleteSmartHomeInterface(interf, successCallback, errorCallback){
	if (!interf || !interf.id){
		showMessage('Error: missing HUB interface ID (unique name)');
		if (errorCallback) errorCallback();
		return;
	}
	var body = {
		"id": interf.id
	};
	genericPostRequest("assist", "integrations/smart-home/removeInterface", body,
		function (data){
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
			//showMessage(JSON.stringify(data, null, 2));
			console.log("Removed smart home interface: " + interf.id);
			if (successCallback) successCallback();
		},
		function (data){
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			showMessage(JSON.stringify(data, null, 2));
			var msg = "Could not remove smart home interface: " + interf.id;
			console.error(msg);
			//alert(msg);
			if (errorCallback) errorCallback();
		}
	);
}

function setSmartHomeItemState(shi){
	console.log("setSmartHomeItemState", shi);
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}
	var newVal;
	var oldValStr = shi.state == undefined? "" : (typeof shi.state == "number"? (""+shi.state) : (shi.state || ""));
	var oldVal = oldValStr.toLowerCase() || "?";
	var deviceType = shi.type;
	var stateType = "text_binary";	//shi.stateType
	var shiSetCmds = getSmartHomeItemMetaData(shi, "setCmds", true) || {};
	switch (oldVal) {
		case "off":
			newVal = ((shiSetCmds.enable != undefined)? shiSetCmds.enable : "on");
			break;
		case "on":
			newVal = ((shiSetCmds.disable != undefined)? shiSetCmds.disable : "off");
			break;
		case "open":
			newVal = ((shiSetCmds.disable != undefined)? shiSetCmds.disable : "closed");
			break;
		case "closed":
			newVal = ((shiSetCmds.enable != undefined)? shiSetCmds.enable : "open");
			break;
		default:
			//set cmds used?
			if (shiSetCmds.enable != undefined && shiSetCmds.disable != undefined && oldValStr == shiSetCmds.disable){
				newVal = shiSetCmds.enable;
			}else if (shiSetCmds.enable != undefined && shiSetCmds.disable != undefined && oldValStr == shiSetCmds.enable){
				newVal = shiSetCmds.disable;
			//a number?
			}else if (!!oldValStr.match(/^[\d,.]+$/)){
				if (shiSetCmds.enable != undefined && shiSetCmds.disable != undefined){
					newVal = shiSetCmds.disable;
					if (oldValStr == "0"){
						newVal = shiSetCmds.enable;
					}else{
						newVal = shiSetCmds.disable;
					}
				}else if (deviceType == 'roller_shutter' || deviceType == 'garage_door'){
					newVal = "closed";
				}else{
					//TODO: this might be too general
					if (oldValStr == "0"){
						newVal = "on";
					}else{
						newVal = "off";
					}
				}
			//set cmds again
			}else if (shiSetCmds.disable != undefined){
				newVal = shiSetCmds.disable;
			//no idea
			}else{
				//TODO
			}
	}
	if (newVal == undefined){
		//alert("Cannot switch device state due to unknown old state: " + oldValStr);
		ByteMind.ui.showPopup("Cannot switch device state due to unknown old state: " + oldValStr);
		return;
	}else{
		smartHomeClearRefreshTimer();
	}
	var state = {
		value: newVal,
		type: stateType
	};
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		device: shi,
		state: state
	};
	genericPostRequest("assist", "integrations/smart-home/setDeviceState", body,
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			//refresh device items
			var changedDevices = [];
			changedDevices.push(shi);
			refreshSmartHomeDevices(changedDevices);
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		}
	);
}

//------ DOM ------

function loadSmartHomeGetDevicesFilter(){
	var options = buildSmartHomeTypeOptions('', true);
	$('#smarthome-devices-filter').html(options).on('change', function(){
		getSmartHomeDevices();
	});
}

function addSmartHomeItemToDom(shiObj, isHidden, showHidden, doPrepend, animateAppear){
	if (doPrepend){
		$('#smarthome-devices-list').prepend(shiObj);
	}else{
		$('#smarthome-devices-list').append(shiObj);
	}
	if (isHidden){
		$(shiObj).addClass("hidden");
		if (showHidden){
			$(shiObj).show();
		}
	}
	if (animateAppear){
		$(shiObj).addClass("invisible");
		setTimeout(function(){ $(shiObj).removeClass("invisible"); }, 150);
	}
}
function addSmartHomeItemListeners(itemObj){
	//add button listeners
	$(itemObj).find('.shi-property').on('change', function(){
		var that = this;
		var $item = $(this).closest('.smarthome-item');
		$item.addClass('unsaved');
		var property = $(this).attr('data-shi-property');
		//console.log(property);
		var newVal = $(this).attr('data-shi-value') || $(this).val();
		if (this.tagName.toLowerCase() == "select"){
			this.title = newVal;
		}
		var shiString = $item.attr('data-shi');
		if (shiString && newVal != undefined){
			var shi = JSON.parse(shiString);
			if (!itemObj.isOnline){
				//just refresh attributes
				refreshSmartHomeItemProperty(shi, property, newVal);
				$item.attr('data-shi', JSON.stringify(shi));
			}else{
				//send to server and refresh attributes at success
				putSmartHomeItemProperty(shi, property, newVal, function(updatedShi){
					shi = updatedShi;
					$item.attr('data-shi', JSON.stringify(shi));
					$item.removeClass('unsaved');
				});
			}
		}
	}).on('click', function(){
		if (itemObj.isOnline){
			smartHomeClearRefreshTimer();
		}
	});
}
function activateSmartHomeItem(itemObj, isOnline){
	itemObj.isOnline = isOnline;
	if (isOnline){
		$(itemObj).removeClass('offline');
	}else{
		$(itemObj).addClass('offline');
	}
}

function btnCreateSmartHomeItem(){
	if (!smartHomeSystemLoaded || !smartHomeServerLoaded){
		ByteMind.ui.showPopup("NOTE: No HUB has been loaded yet. " 
			+ "'Create Device' will only create a basic dummy card in this mode and some selectors might still be empty.<br>"
			+ "Please consider loading the HUB first before creating a new device."
		);
	}
	createSmartHomeItem();
}
function createSmartHomeItem(shi){
	//NOTE: this is currently only used for the "new device" button (I guess?) but we set "isNew" anyway
	var isOnline = true;	//TODO: just assume in case we use this with pre-loaded 'shi' data at some point
	if (!shi){
		isOnline = false;	//a new device card
		shi = {
			interface: "basic",
			name: ("New Item " + newSmartHomeDeviceCounter++),
			stateMemory: "",
			meta: {
				origin: "internal",
				namedBySepia: false,
				//typeGuessed: true,
				isIncomplete: true,
				id: ""
			},
			stateType: "number_percent",
			link: "",
			state: "off",
			type: "other",
			room: "",
			roomIndex: ""
		}
	}
	var obj = buildSmartHomeItem(shi);
	if (obj){
		$('#smarthome-devices-list').find('.smarthome-devices-list-info').remove();
		addSmartHomeItemToDom(obj, false, false, true, true);
		addSmartHomeItemListeners(obj);
		activateSmartHomeItem(obj, isOnline);	//will set "offline" state
	}
}
function buildSmartHomeItem(shi){
	var shiObj = document.createElement("div");
	shiObj.className = "smarthome-item";
	shiObj.setAttribute("data-shi", JSON.stringify(shi));
	var itemName = shi.name;
	var itemId = shi.meta.id;
	var shiSetCmds = getSmartHomeItemMetaData(shi, "setCmds", false);
		if (shiSetCmds && shiSetCmds == "{}") shiSetCmds = "";
	var shiInterfaceConfig = getSmartHomeItemMetaData(shi, "interfaceConfig", false);
		if (shiInterfaceConfig && shiInterfaceConfig == "{}") shiInterfaceConfig = "";
	var namedBySepia = shi.meta["namedBySepia"];
	var itemIsIncomplete = shi.meta["isIncomplete"];
	var interfaceDeviceId = shi.meta["interfaceDeviceId"];
	var origin = shi.meta["origin"];
	var shiNameClasses = "shi-property smarthome-item-name";
	if (!namedBySepia){
		shiNameClasses += " unconfirmed";
	}
	var shiObjContent = sanitizeHtml("" +
		"<div class='smarthome-item-title'>" + 
			"<div style='overflow:hidden;'>" +
				"<span class='" + shiNameClasses + "' data-shi-property='" + SEPIA_TAG_NAME + "' data-shi-value='" + itemName + "'>" + escapeHtml(itemName) + "</span>" +
				"<span class='smarthome-item-id'> - " + escapeHtml(itemId) + "</span>" +
			"</div>" +
			"<div style='display:flex;'>" +
				"<button class='shi-control-name' title='Edit device name'><i class='material-icons md-18'>edit</i></button>" +
				"<button class='shi-control-toggle' title='Toggle device on/off (for testing)'><i class='material-icons md-18'>power_settings_new</i></button>" +
				"<button class='shi-control-delete internal-card-only' title='Remove custom device' style='display: none;'><i class='material-icons md-18'>delete</i></button>" +
				"<button class='shi-control-save internal-card-only' title='Store new device. NOTE: will turn red again if device communication showed errors!' style='display: none;'><i class='material-icons md-18'>save</i></button>" +
			"</div>" +
		"</div>" +
		"<div class='smarthome-item-body'>" + 
			"<div><label>State:</label>" + "<span class='shi-info smarthome-item-state'>" + shi.state + "</span></div>" + 
			"<div><label>Type:" + 
					"<span class='smarthome-item-type-confirm' style='display:none;' title='Type is an automatic guess. Confirm?'>&#10003;</span>" + 
				"</label>" + 
				"<select class='shi-property smarthome-item-type' data-shi-property='" + SEPIA_TAG_TYPE + "'>" +
					buildSmartHomeTypeOptions(shi.type, false) +
			"</select></div>" + 
			"<div><label>Room:</label><div style='flex: 1 0 128px; min-width: 196px;'>" + 
				"<select style='width: calc(70% - 4px); min-width: auto;' class='shi-property smarthome-item-room' data-shi-property='" + SEPIA_TAG_ROOM + "'>" +
					buildSmartHomeRoomOptions(shi.room) +
				"</select>" + 
				"<input style='width: calc(30% - 4px); min-width: auto; text-align: center;' class='shi-property smarthome-item-room-index' spellcheck='false' " +
					"data-shi-property='" + SEPIA_TAG_ROOM_INDEX + "' " +
					"value='" + (shi.roomIndex || "") + "' placeholder='index' type='text' title='Room index, e.g. 1, 22, 303, ...'>" +
			"</div></div>" + 
			"<div class='start-hidden internal-card-only' style='display:none;'><label>Interface:</label><div style='flex: 1 0 128px; min-width: 196px; display: flex; justify-content: center; align-items: center;'>" + 
				"<select style='width: calc(100% - 42px); min-width: auto;' class='shi-property smarthome-item-interface' data-shi-property='" + SEPIA_TAG_INTERFACE + "'>" +
					buildSmartHomeCustomHubOptions(shi.interface) +
				"</select>" + 
				"<button style='width: 34px; min-width: auto; margin: 8px 2px;' class='smarthome-item-interface-edit'><i class='material-icons md-txt'>edit</i></button>" + 
			"</div></div>" + 
			"<div class='start-hidden internal-card-only' style='display:none;'><label>Int. device ID:</label><div style='flex: 1 0 128px; min-width: 196px; display: flex; justify-content: center; align-items: center;'>" + 
				"<input class='shi-property smarthome-item-interface-device-id' data-shi-property='" + SEPIA_TAG_INTERFACE_DEVICE_ID + "' style='width: calc(100% - 42px); min-width: auto;' spellcheck='false' " +
					"value='" + (interfaceDeviceId || "") + "' " +
					"placeholder='ID, URL, topic (w/o prefix), etc.' type='text' " + 
					"title='A unique identifier of the device defined by the used interface, e.g. an ID, MQTT topic or part of an URL. NOTE: A prefix for MQTT topics is set automatically, e.g.: sepia/smart-devices/[your-topic].'>" +
				"<button style='width: 34px; min-width: auto; margin: 8px 2px;' class='smarthome-item-interface-device-search'><i class='material-icons md-txt'>search</i></button>" + 
			"</div></div>" +
			"<div class='start-hidden' style='display:none;'><label>Int. dev. config:</label><div style='flex: 1 0 128px; min-width: 196px; display: flex; justify-content: center; align-items: center;'>" + 
				"<input class='shi-property smarthome-item-interface-config' data-shi-property='" + SEPIA_TAG_INTERFACE_CONFIG + "' style='font-size: 11px; width: calc(100% - 42px); min-width: auto;' " +
					"value='" + shiInterfaceConfig + "' spellcheck='false' " +
					"placeholder='e.g.: {\"set\":\"[domain]/[service]\", \"off\":\"...\"}' type='text' title='Define interface configuration properties required to control the specific device.'>" +
				"<button style='width: 34px; min-width: auto; margin: 8px 2px;' class='smarthome-item-interface-config-edit'><i class='material-icons md-txt'>edit</i></button>" + 
			"</div></div>" +
			"<div class='start-hidden' style='display:none;'><label>State type:</label>" + "<select class='shi-property smarthome-item-state-type' data-shi-property='" + SEPIA_TAG_STATE_TYPE + "'>" +
					buildSmartHomeStateTypeOptions(shi.stateType) +
			"</select></div>" + 
			"<div class='start-hidden' style='display:none;'><label>Custom config:</label><div style='flex: 1 0 128px; min-width: 196px; display: flex; justify-content: center; align-items: center;'>" + 
				"<input class='shi-property smarthome-item-set-cmds' data-shi-property='" + SEPIA_TAG_SET_CMDS + "' style='font-size: 11px; width: calc(100% - 42px); min-width: auto;' " +
					"value='" + shiSetCmds + "' spellcheck='false' " +
					"placeholder='e.g.: {\"enable\":\"on\", \"disable\":\"off\", \"number\":\"pct <val>\"}' type='text' title='For experts: Set custom commands used when writing a new state.'>" +
				"<button style='width: 34px; min-width: auto; margin: 8px 2px;' class='smarthome-item-set-cmds-edit'><i class='material-icons md-txt'>edit</i></button>" + 
			"</div></div>" +
		"</div>" +
		"<div class='smarthome-extend-body-btn'><div class='smarthome-extend-body-icon'>&#8250;</div></div>"
	);
	var $shiObj = $(shiObj);
	$shiObj.append(shiObjContent);
	//set all selector titles to selected value (helpful tooltip for manual device configurations)
	$shiObj.find("select.shi-property").each(function(i, item){
		item.title = item.value;
	});
	//is type guessed?
	if (shi.meta && shi.meta.typeGuessed){
		$shiObj.find('.smarthome-item-type-confirm').show().on('click', function(){
			shi.meta["typeGuessed"] = false;
			shiObj.setAttribute("data-shi", JSON.stringify(shi));	//write shi first
			$shiObj.find('.smarthome-item-type').trigger('change');
			$(this).hide();
		});
	}
	//extend button
	$shiObj.find('.smarthome-extend-body-btn').on('click', function(){
		$(this).find('.smarthome-extend-body-icon').toggleClass('up');
		$shiObj.find('.start-hidden').toggle(300);
	});
	//title
	$shiObj.find('.smarthome-item-name').on('click', function(){
		$shiObj.find('.smarthome-item-id').toggle();
	});
	$shiObj.find('.shi-control-name').on('click', function(){
		shi = JSON.parse($shiObj.attr('data-shi'));				//update shi obj first!
		smartHomeClearRefreshTimer();
		var newName = prompt("New name:", shi.name);
		if (newName){
			//update name flag first
			shi.meta["namedBySepia"] = true;
			shiObj.setAttribute("data-shi", JSON.stringify(shi));	//write shi first
			//set and submit
			$shiObj.find('.smarthome-item-name')
				.html(escapeHtml(newName))
				.attr("data-shi-value", newName)
				.removeClass("unconfirmed")
				.trigger('change');
		}
	});
	//toggle button
	$shiObj.find('.shi-control-toggle').on('click', function(){
		shi = JSON.parse($shiObj.attr('data-shi'));				//update shi obj first!
		setSmartHomeItemState(shi);
	});
	//custom cmds JSON edit
	$shiObj.find('.smarthome-item-set-cmds-edit').on('click', function(){
		smartHomeClearRefreshTimer();
		var introText = "<p>Here you can customize the 'state' sent to your device after certain actions.</p>"
			+ "Trigger-text examples:<br><ul>"
				+ "<li><u>enable</u>: \"<b>Switch on</b> the light\"</li>"
				+ "<li><u>disable</u>: \"<b>Turn off</b> the light\"</li>"
				+ "<li><u>number</u>: \"Set the light to <b>50%</b>\"</li>"
			+ "</ul>"
			+ "With type 'raw text':<br><ul>"
				+ "<li><u>raw</u>: \"Set the light to <b>value RED</b>\"</li>"
			+ "</ul>";
		ByteMind.ui.showJsonPopup(
			introText,
			JSON.parse($shiObj.find('.smarthome-item-set-cmds').val()
				|| '{"enable": "on", "disable": 0, "number": "<val> XY", "raw": "<val>"}'),
			function(newJson){
				var newVal = JSON.stringify(newJson);
				if (newVal){
					$shiObj.find('.smarthome-item-set-cmds').val(newVal).trigger('change');
				}
			},{
				jsonPlaceholder: '{\n  "enable": "on",\n  "disable": 0,\n  "number": "<val> XY",\n  "raw": "<val>"\n}'
			}
		);
	});
	
	//-- custom device --
	
	var $delBtn = $shiObj.find('.shi-control-delete');
	var $saveBtn = $shiObj.find('.shi-control-save');
	//interface edit
	$shiObj.find('.smarthome-item-interface-edit').on('click', function(){
		var shInterface = $shiObj.find('.smarthome-item-interface').val();
		if (shInterface){
			buildSmartHomeInterfaceEditor(findSmartHomeInterface(shInterface));
		}else{
			buildSmartHomeInterfaceEditor();
		}
	});
	//search interface device
	$shiObj.find('.smarthome-item-interface-device-search').on('click', function(){
		smartHomeClearRefreshTimer();
		var $devIdInputField = $shiObj.find(".smarthome-item-interface-device-id");
		var currentDevId = $devIdInputField.val();
		var interfaceId = $shiObj.find(".smarthome-item-interface").get(0).value || "";
		if (!interfaceId || interfaceId == "basic"){
			ByteMind.ui.showPopup("Please select an interface first.");
			return;
		}
		//TODO: check interface type type and warn if not supported
		var typeFilter = "";	//NOTE: we could add a type filter
		getSmartHomeDevicesForHub(interfaceId, typeFilter, function(devices){
			if (devices && devices.length > 0){
				//sort
				devices.sort(function(a, b){
					if (a.name > b.name) return 1;
					else if (a.name < b.name) return -1;
					else return 0;
				});
				var options = [];
				var selector = document.createElement("select");
				selector.style.cssText = "";
				selector.innerHTML = "<option value='' disabled selected>- Choose -</option>";
				devices.forEach(function(item){
					//console.log("item", item);
					var id = item.meta && item.meta.id;
					if (id){
						options.push({name: item.name, value: id, item: item});
						var opt = document.createElement("option");
						opt.textContent = item.name || item.id;
						opt.value = JSON.stringify(item);
						selector.appendChild(opt);
						if (currentDevId == id) opt.selected = true;
					}
				});
				var content = document.createElement("div");
				var intro = document.createElement("div");
				intro.innerHTML = sanitizeHtml("<p>HUB: " + interfaceId + "</p><p>Select a device from the list:</p>");
				var info = document.createElement("div");
				var noDeviceText = "<p style='text-align: center;'>- no device selected -</p>";
				info.style.cssText = "text-align: left; font-size: 14px; padding: 0 16px; margin: 20px 8px 4px 8px; " 
					+ "border: 1px solid; box-shadow: 0 0 4px 2px rgba(0, 0, 0, 0.15); overflow-x: auto;";
				info.innerHTML = noDeviceText;
				selector.onchange = function(){
					if (!selector.value){
						info.innerHTML = noDeviceText;
					}else{
						var item = JSON.parse(selector.value);
						console.log("Item selected", item);		//DEBUG
						info.innerHTML = sanitizeHtml(
							"<p><b>ID:</b> " + item.meta.id + "</p>" +
							"<p><b>Type:</b> " + item.type + "</p>" +
							"<p><b>Room:</b> " + item.room + "</p>" +
							"<p><b>State:</b> " + item.state + "</p>"
						);
					}
				}
				content.appendChild(intro);
				content.appendChild(selector);
				content.appendChild(info);
				//refresh info text once
				$(selector).trigger('change');
				var config = {
					buttonOneName: "Confirm",
					buttonOneAction: function(){
						if (!selector.value){
							$devIdInputField.val("").trigger('change');
						}else{
							var item = JSON.parse(selector.value);
							$devIdInputField.val(item.meta.id).trigger('change');
						}
						ByteMind.ui.hidePopup();
					},
					buttonTwoName: "Abort",
					buttonTwoAction: function(){}
				}
				ByteMind.ui.showPopup(content, config);
			}else{
				ByteMind.ui.showPopup("No devices found.");
			}
		}, function(err){
			ByteMind.ui.showPopup("Failed to load devices from HUB. Access or HUB error?");
		});
	});
	//interface config for device
	$shiObj.find('.smarthome-item-interface-config-edit').on('click', function(){
		smartHomeClearRefreshTimer();
		var introText = "<p>Here you can customize the device interface configuration if your HUB requires more complex information.</p>"
			+ "Config JSON example (Home Assistant):<br><ul style='font-size: 15px;'>"
				+ "<li>\"on\": {\"service\": \"light/turn_on\"}</li>"
				+ "<li>\"set\": {\"service\": \"light/turn_on\", \"write\": \"&lt;attributes.brightness_pct&gt;\"}</li>"
				+ "<li>\"off\": {\"service\": \"light/turn_off\"}</li>"
				+ "<li>\"read\": \"round(&lt;attributes.brightness&gt;*0.392)\"</li>"
				+ "<li>\"default\": {\"state\": \"off\", \"value\": \"0\"}</li>"
			+ "</ul>"
			+ "Predefined JSON example (Home Assistant):<br><ul style='font-size: 15px; list-style-type: decimal;'>"
				+ "<li>\"config\": \"light.brightness\"</li>"
				+ "<li>\"config\": \"light.onoff\"</li>"
				+ "<li>\"config\": \"sensor.state\"</li>"
				+ "<li>\"config\": \"intent.demo\"</li>"
			+ "</ul>";
		ByteMind.ui.showJsonPopup(
			introText, JSON.parse($shiObj.find('.smarthome-item-interface-config').val() || '{}'),
			function(newJson){
				var newVal = JSON.stringify(newJson);
				if (newVal){
					$shiObj.find('.smarthome-item-interface-config').val(newVal).trigger('change');
				}
			}, {
				jsonPlaceholder: '{\n  "config": "..."\n}\n\nOR:\n\n{\n  "read": "...",\n  "on": "...",\n  ...\n}'
			}
		);
	});
	
	//clean up card
	if (origin && origin == "internal"){
		$delBtn.show();
		$saveBtn.show();
	}else{
		$shiObj.find('.internal-card-only').remove();
	}
	if (itemIsIncomplete){
		$saveBtn.closest(".smarthome-item").addClass('incomplete');
	}else if (itemId){
		//stored and complete (for now)
		$saveBtn.remove();	//we don't need it anymore, everything else is handled via single properties
	}
	//delete button
	$delBtn.on('click', function(){
		shi = JSON.parse($shiObj.attr('data-shi'));	//update shi obj first!
		if ($shiObj.hasClass("offline")){
			$shiObj.addClass("invisible");
			setTimeout(function(){ $shiObj.remove(); }, 500);
		}else{
			deleteSmartHomeItem(shi, function(){
				//success
				$shiObj.addClass("invisible");
				setTimeout(function(){ $shiObj.remove(); }, 500);
			}, function(err){
				//fail
			});
		}
	});
	$saveBtn.on('click', function(){
		shi = JSON.parse($shiObj.attr('data-shi'));	//update shi obj first!
		storeSmartHomeItem(shi, function(){
			//success
			$saveBtn.remove();
			activateSmartHomeItem(shiObj, true);	//will set/remove "offline" class
			$shiObj.removeClass('unsaved');	//complete store removes this class as well
		}, function(err){
			//fail
		});
	});
	return shiObj;
}
function buildSmartHomeInterfaceEditor(shInterface){
	if (!shInterface) shInterface = {
		id: "",
		type: "",
		host: "",
		authType: "",
		authData: "",
		info: {
			desc: ""
		}
	};
	var config = {
		useSmallCloseButton: true
	}
	var interfaceEditor = document.createElement("div");
	interfaceEditor.innerHTML = sanitizeHtml("<h3>Interface Editor</h3>" +
		"<div style='display: flex; flex-direction: column;'>" + 
			"<label>Unique Name:</label>" + 
				"<input class='smarthome-interface-id' spellcheck='false' placeholder='openHAB-2, FHEM_X, ...' value='" + shInterface.id + "'>" + 
			"<label>Interface Type:</label>" + 
				"<select class='smarthome-interface-type'>" + buildSmartHomeInterfaceOptions(shInterface.type) + "</select>" + 
			"<label>Host Address:</label>" + 
				"<input class='smarthome-interface-host' spellcheck='false' placeholder='http://localhost:8083/myHub' type='url' value='" + shInterface.host + "'>" +
			//"<button class='smarthome-interface-reg-btn'>REGISTER</button>" +
			"<label>Auth. Type (optional):</label>" +
				//"<input class='smarthome-interface-authType' spellcheck='false' placeholder='Basic, Bearer or Plain (if supported)' value='" + shInterface.authType + "'>" + 
				"<select class='smarthome-interface-authType'>" + buildSmartHomeInterfaceAuthTypeOptions(shInterface.authType) + "</select>" +
			"<label>Auth. Data (optional):</label>" + 
				"<input class='smarthome-interface-authData' spellcheck='false' placeholder='dXNlcjp0ZXN0MTIzNDU=' value='" + shInterface.authData + "'>" + 
			"<label>Description:</label>" + 
				"<input class='smarthome-interface-desc' placeholder='Any info text ...' value='" + (shInterface.info? shInterface.info.desc : "") + "'>" + 
			"<div style='margin-top: 16px;'>" + 
				"<button class='smarthome-interface-btn-save'>SAVE</button>" + 
				"<button class='smarthome-interface-btn-cancel'>CANCEL</button>" + 
				"<button class='smarthome-interface-btn-delete' style='background: #f00;'>DELETE</button>" + 
			"</div>" +
		"</div>");
	ByteMind.ui.showPopup(interfaceEditor, config);
	var $ie = $(interfaceEditor);
	//save button
	$ie.find('.smarthome-interface-btn-save').on('click', function(){
		createOrUpdateSmartHomeInterface(getSmartHomeInterfaceFromEditor(interfaceEditor),
		function(){
			//success
			setTimeout(function(){
				ByteMind.ui.hidePopup();
				loadSmartHomeCustomInterfaces();
			}, 1000);
		},
		function(err){
			//fail
			alert("Failed to create smart home HUB interface! Check console for more info.");
		});
	});
	//cancel
	$ie.find('.smarthome-interface-btn-cancel').on('click', function(){
		ByteMind.ui.hidePopup();
	});
	//delete button
	$ie.find('.smarthome-interface-btn-delete').on('click', function(){
		var q = confirm("Do you really want to delete this interface?");
		if (q){
			deleteSmartHomeInterface(getSmartHomeInterfaceFromEditor(interfaceEditor),
			function(){
				//success
				setTimeout(function(){
					ByteMind.ui.hidePopup();
					loadSmartHomeCustomInterfaces();
				}, 1000);
			},
			function(err){
				//fail
				alert("Failed to delete smart home HUB interface! Check console for more info.");
			});
		}
	});
	//register button
	$ie.find('.smarthome-interface-reg-btn').on('click', function(){
		//TODO
		console.error("So far we don't need it since all properties are stored in the SEPIA database ;-)");
	});
}
function updateAllSmartHomeInterfaceSelectors(){
	var $selectors = $('.smarthome-item-interface');
}
function getSmartHomeInterfaceFromEditor(interfaceEditor){
	var $ie = $(interfaceEditor);
	var iObj = {
		id: $ie.find('.smarthome-interface-id').val(),
		host: $ie.find('.smarthome-interface-host').val(),
		type: $ie.find('.smarthome-interface-type').val(),
		info: {
			desc: $ie.find('.smarthome-interface-desc').val()
		},
		authType: $ie.find('.smarthome-interface-authType').val(),
		authData: $ie.find('.smarthome-interface-authData').val()
	}
	return iObj;
}
//TODO: read from server
function buildSmartHomeTypeOptions(selected, addAllOption){
	var options = {
		"light": "Light",
		"heater": "Heater",
		"air_conditioner": "Air Conditioner",
		"temperature_control": "Temperature Control",
		"fan": "Fan",
		"tv": "TV",
		"music_player": "Music Player",
		"roller_shutter": "Roller Shutter",
		"power_outlet": "Power Outlet",
		"sensor": "Sensor",
		"fridge": "Fridge",
		"oven": "Oven",
		"coffee_maker": "Coffee Maker",
		"garage_door": "Garage Door",
		"device": "Device",
		"other": "Other",
		"hidden": "Hidden"
	}
	return buildOptionsSelector(options, selected, function(optionsObj){
		if (addAllOption){
			return ("<option value='' disabled>- Choose -</option><option value=''>All</option>" + optionsObj);
		}else{
			return ("<option value='' disabled>- Choose -</option>" + optionsObj);
		}
	}, function(optionsObj){
		if (addAllOption){
			return ("<option value='' disabled selected>- Choose -</option><option value=''>All</option>" + optionsObj);
		}else{
			return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
		}
	});
}
//TODO: read from server
function buildSmartHomeRoomOptions(selected){
	var options = {
		"livingroom": "Living room",
		"diningroom": "Dining room",
		"kitchen": "Kitchen",
		"bedroom": "Bedroom",
		"bath": "Bath",
		"office": "Office",
		"study": "Study room",
		"childsroom": "Child's room",
		"garage": "Garage",
		"basement": "Basement",
		"garden": "Garden",
		"sunroom": "Winter garden",
		"terrace": "Terrace",
		"balcony": "Balcony",
		"hallway": "Hallway",
		"entrance": "Entrance",
		"shack": "Shack",
		"attic": "Attic",
		"other": "Other",
		"unassigned": "Not assigned"
	}
	return buildOptionsSelector(options, selected, function(optionsObj){
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}, function(optionsObj){
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	});
}
function buildSmartHomeStateTypeOptions(selected){
	var options = {
		"text_binary" : "Binary (ON, OPEN, ...)",
		"number_plain" : "Number (plain)",
		"number_percent" : "Number (percent)",
		"number_temperature_c" : "Temperature °C",
		"number_temperature_f" : "Temperature °F",
		"text_raw" : "Raw text"
	}
	return buildOptionsSelector(options, selected, function(optionsObj){
		return ("<option value='' disabled>- Choose -</option><option value=''>Automatic</option>" + optionsObj);
	}, function(optionsObj){
		return ("<option value='' disabled selected>- Choose -</option><option value=''>Automatic</option>" + optionsObj);
	});
}
function buildSmartHomeInterfaceOptions(selected){
	//TODO: we could buffer options and only rebuild if it changes ...
	var options = {};
	if (smartHomeCustomInterfaceTypes){
		smartHomeCustomInterfaceTypes.forEach(function(cit){
			options[cit.value] = cit.name;
		});
	}
	return buildOptionsSelector(options, selected, function(optionsObj){
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}, function(optionsObj){
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	});
}
function buildSmartHomeCustomHubOptions(selected){
	//TODO: we could buffer options and only rebuild if it changes ...
	var options = {};
	if (smartHomeCustomInterfaces){
		smartHomeCustomInterfaces.forEach(function(ci){
			options[ci.id] = ci.id + " (" + ci.type + ")";
		});
	}
	return buildOptionsSelector(options, selected, function(optionsObj){
		return ("<option value='' disabled>- Choose -</option><option value=''>- New -</option>" + optionsObj);
	}, function(optionsObj){
		return ("<option value='' disabled selected>- Choose -</option><option value=''>- New -</option>" + optionsObj);
	});
}
function updateAllSmartHomeCustomHubSelectors(){
	var $selectors = $('.smarthome-item-interface');
	var availableOptions = buildSmartHomeCustomHubOptions();
	$selectors.each(function(i, sel){
		var currentVal = sel.value;
		sel.innerHTML = sanitizeHtml(availableOptions);
		sel.value = currentVal;
	});
}

function buildSmartHomeInterfaceAuthTypeOptions(selected){
	var options = {};
	if (smartHomeInterfaceAuthTypes){
		smartHomeInterfaceAuthTypes.forEach(function(at){
			options[at.value] = at.name;
		});
	}
	return buildOptionsSelector(options, selected, function(optionsObj){
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}, function(optionsObj){
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	});
}


//------- build some stuff for DOM --------

loadSmartHomeGetDevicesFilter();
