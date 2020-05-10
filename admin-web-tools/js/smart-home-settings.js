//------ INTERFACE: ------

var smartHomeSystem = "";
var smartHomeServer = "";
var smartHomeSystemLoaded = "";
var smartHomeServerLoaded = "";
var smartHomeCustomInterfaces;
var smartHomeCustomInterfaceTypes;

var SEPIA_TAG_NAME = "sepia-name";
var SEPIA_TAG_TYPE = "sepia-type";
var SEPIA_TAG_ROOM = "sepia-room";
var SEPIA_TAG_ROOM_INDEX = "sepia-room-index";
var SEPIA_TAG_DATA = "sepia-data";
var SEPIA_TAG_MEM_STATE = "sepia-mem-state";
var SEPIA_TAG_STATE_TYPE = "sepia-state-type";
var SEPIA_TAG_SET_CMDS = "sepia-set-cmds";

var SEPIA_TAG_INTERFACE = "sepia-interface";

//TODO: rename
var showHidden = false;		//state of show/hide button, starts with false
var refreshDelayTimer;		//timer that automatically refreshes stuff after change by user

function smartHomeOnStart(){
	smartHomeSystem = appStorage.getItem('smartHomeSystem');
	if (smartHomeSystem){
		$('#smarthome-devices-create').hide();
		if (hasSelectedKnownSmartHomeSystem(smartHomeSystem)){
			$('#smarthome_system_select').val(smartHomeSystem);
			//$('#smarthome-server').addClass("disabled").attr("disabled", true);
		}else{
			$('#smarthome_system_select').val('custom');
			$('#smarthome_system_custom_select').val(smartHomeSystem);
			$('#smarthome_system_custom').show();
			//$('#smarthome-server').removeClass("disabled").attr("disabled", false);
		}
		if (smartHomeSystem == "internal"){
			$('#smarthome-devices-create').show();
		}
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
		$('#smarthome-devices-create').hide();
		$('#smarthome_system_custom').hide();
		//$('#smarthome-server').addClass("disabled").attr("disabled", true);
		$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
		if (this.value == "custom"){
			$('#smarthome_system_custom').show();
			//$('#smarthome-server').removeClass("disabled").attr("disabled", false);
		}else if (this.value == "internal"){
			$('#smarthome-devices-create').show();
		}
	});
}

function hasSelectedKnownSmartHomeSystem(sys){
	var isOption = false;
	$('#smarthome_system_select option').each(function(){
		if (this.value == sys) {
			isOption = true;
			return false;
		}
	});
	return isOption;
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
function getSmartHomeHubDataFromServer(successCallback, errorCallback){
	var body = {};
	if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
	genericPostRequest("assist", "integrations/smart-home/getConfiguration", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log("getSmartHomeHubDataFromServer", data);
			data.hubName = data.hubName.toLowerCase();
			$('#smarthome_system_select').val(data.hubName).trigger("change");
			$('#smarthome-server').val(data.hubHost);
			//remember loaded ones
			smartHomeSystemLoaded = data.hubName;
			smartHomeServerLoaded = data.hubHost;
			$('#smarthome-server-indicator').removeClass('inactive').addClass('secure');
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
function writeSmartHomeHubDataToServer(){
	var hubName = $("#smarthome_system_select").val();
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
		var body = {
			"setConfig": JSON.stringify(d)
		};
		serverConfigRequest(body, function(){
			//success
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
	if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
	genericPostRequest("assist", "integrations/smart-home/getInterfaces", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log("loadSmartHomeCustomInterfaces", data);
			smartHomeCustomInterfaces = data.interfaces;
			smartHomeCustomInterfaceTypes = data.types;
			if (successCallback) successCallback(data);
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			if (errorCallback) errorCallback(data);
		}
	);
}

//item methods

function getItemMetaData(item, fieldName, asObject){
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
	}
}

//other methods

function getSmartHomeDevices(successCallback, errorCallback){
	if (smartHomeSystemLoaded && smartHomeServerLoaded){
		$('#smarthome_system_select').val(smartHomeSystemLoaded).trigger("change");
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
		if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		deviceTypeFilter: $('#smarthome-devices-filter').val()
	};
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
				//build DOM objects
				$('#smarthome-devices-list').html("");
				devices.forEach(function(item){
					var domObj = buildSmartHomeItem(item);
					if (domObj){
						var isHidden = item.type == "hidden";
						addSmartHomeItemToDom(domObj, isHidden, showHidden);
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
						if (!showHidden){
							showHiddenBtn.innerHTML = "Show " + hiddenDevices + " hidden devices";
						}else{
							showHiddenBtn.innerHTML = "Hide " + hiddenDevices + " hidden devices";
						}
					}
					updateBtnText();
					$('#smarthome-devices-list').append(showHiddenBtn);
					$(showHiddenBtn).on('click', function(){
						$('.smarthome-item.hidden').toggle();
						showHidden = !showHidden;
						updateBtnText();
					});
				}
			}else{
				$('#smarthome-devices-list').html("<h3 class='smarthome-devices-list-info' style='color: #beff1a;'>No devices found.</h3>");
				//alert("No devices found.");
			}
			if (successCallback) successCallback(devices);
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			$('#smarthome-devices-list').html("<h3 class='smarthome-devices-list-info' style='color: #f00;'>No items found or no access to smart home system.</h3>");
			//alert("No items found or no access to smart home system.");
			if (errorCallback) errorCallback(data);
		}
	);
}

function refreshSmartHomeDevices(changedDevices){
	//TODO: improve and use 'changedDevices' array
	//		maybe let user select if refresh is: onEvent, onTime, manually ?
	if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
	if (changedDevices){
		refreshDelayTimer = setTimeout(function(){
			getSmartHomeDevices();
		}, 3000);
	}else{
		getSmartHomeDevices();
	}
}

function registerSepiaInsideSmartHomeHub(){
	//$('#smarthome-devices-list').html("");
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}else{
		if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
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
		if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
	}
	var attribs = {};
	attribs[property] = value;
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
			console.log("Smart home item: " + shi.name + ", changed '" + property + "' to: " + value);
			//refresh attributes
			refreshSmartHomeItemProperty(shi, property, value);
			//refresh UI
			var changedDevices = [];
			changedDevices.push(shi);
			refreshSmartHomeDevices(changedDevices);
			//done
			if (successCallback) successCallback();
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('inactive').removeClass('secure');
			var msg = "Smart home item: " + shi.name + ", FAILED to change '" + property + "' to: " + value;
			console.error(msg);
			//alert(msg);
			if (errorCallback) errorCallback();
		}
	);
}
function refreshSmartHomeItemProperty(shi, property, value){
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
			shi.meta["setCmds"] = value;
			break;
		case SEPIA_TAG_INTERFACE:
			shi.interface = value;
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
	if (!hubHost || !hubName || !deviceId){
		showMessage('Error: missing HUB server, host address OR device ID');
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
	var oldVal = shi.state.toLowerCase();
	var deviceType = shi.type;
	var stateType = "text_binary";	//shi.stateType
	var shiSetCmds = getItemMetaData(shi, "setCmds", true) || {};
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
			if (shiSetCmds.enable != undefined && shiSetCmds.disable != undefined && oldVal == shiSetCmds.disable){
				newVal = shiSetCmds.enable;
			}else if (shiSetCmds.enable != undefined && shiSetCmds.disable != undefined && oldVal == shiSetCmds.enable){
				newVal = shiSetCmds.disable;
			//a number?
			}else if (!!oldVal.match(/^[\d,.]+$/)){
				if (shiSetCmds.enable != undefined && shiSetCmds.disable != undefined){
					newVal = shiSetCmds.disable;
					if (oldVal == 0){
						newVal = shiSetCmds.enable;
					}else{
						newVal = shiSetCmds.disable;
					}
				}else if (deviceType == 'roller_shutter'){
					newVal = "closed";
				}else{
					//TODO: this might be too general
					if (oldVal == 0){
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
		//alert("Cannot switch device state due to unknown old state: " + oldVal);
		ByteMind.ui.showPopup("Cannot switch device state due to unknown old state: " + oldVal);
		return;
	}else{
		if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
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

function addSmartHomeItemToDom(shiObj, isHidden, showHidden, doPrepend){
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
}
function addSmartHomeItemListeners(itemObj){
	//add button listeners
	$(itemObj).find('.shi-property').on('change', function(){
		var that = this;
		var $item = $(this).closest('.smarthome-item');
		var property = $(this).attr('data-shi-property');
		//console.log(property);
		var newVal = $(this).attr('data-shi-value') || $(this).val();
		var shiString = $item.attr('data-shi');
		if (shiString && newVal != undefined){
			var shi = JSON.parse(shiString);
			if (!itemObj.isOnline){
				//just refresh attributes
				refreshSmartHomeItemProperty(shi, property, newVal);
				$item.attr('data-shi', JSON.stringify(shi));
			}else{
				//send to server and refresh attributes at success
				putSmartHomeItemProperty(shi, property, newVal, function(){
					//$(that).attr('data-shi-value', newVal);
					$item.attr('data-shi', JSON.stringify(shi));
				});
			}
		}
	}).on('click', function(){
		if (itemObj.isOnline){
			if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
		}
	});
}
function activateSmartHomeItem(itemObj, isOnline){
	itemObj.isOnline = isOnline;
}
var newSmartHomeDeviceCounter = 1;
function createSmartHomeItem(shi){
	if (!shi){
		shi = {
			interface: "basic",
			name: ("New Item " + newSmartHomeDeviceCounter++),
			stateMemory: "",
			meta: {
				origin: "internal",
				namedBySepia: false,
				typeGuessed: true,
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
		addSmartHomeItemToDom(obj, false, false, true);
		addSmartHomeItemListeners(obj);
		activateSmartHomeItem(obj, false);
	}
}
function buildSmartHomeItem(shi){
	var shiObj = document.createElement("div");
	shiObj.className = "smarthome-item";
	shiObj.setAttribute("data-shi", JSON.stringify(shi));
	var itemName = shi.name;
	var itemId = shi.meta.id;
	var shiSetCmds = getItemMetaData(shi, "setCmds", false);
	var namedBySepia = shi.meta["namedBySepia"];
	var origin = shi.meta["origin"];
	var shiNameClasses = "shi-property smarthome-item-name";
	if (!namedBySepia){
		shiNameClasses += " unconfirmed";
	}
	var shiObjContent = "" +
		"<div class='smarthome-item-title'>" + 
			"<div style='overflow:hidden;'>" +
				"<span class='" + shiNameClasses + "' data-shi-property='" + SEPIA_TAG_NAME + "' data-shi-value='" + itemName + "'>" + itemName.replace("<", "&lt;").replace(">", "&gt;") + "</span>" +
				"<span class='smarthome-item-id'> - " + itemId.replace("<", "&lt;").replace(">", "&gt;") + "</span>" +
			"</div>" +
			"<div style='display:flex;'>" +
				"<button class='shi-control-name'><i class='material-icons md-18'>edit</i></button>" +
				"<button class='shi-control-toggle'><i class='material-icons md-18'>power_settings_new</i></button>" +
				"<button class='shi-control-delete internal-card-only' style='display: none;'><i class='material-icons md-18'>delete</i></button>" +
				"<button class='shi-control-save internal-card-only' style='display: none;'><i class='material-icons md-18'>save</i></button>" +
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
				"<input style='width: calc(30% - 4px); min-width: auto; text-align: center;' class='shi-property smarthome-item-room-index' " 
					+ "data-shi-property='" + SEPIA_TAG_ROOM_INDEX + "' " 
					+ "value='" + (shi.roomIndex || "") + "' placeholder='index' type='text' title='Room index, e.g. 1, 22, 303, ...'>" +
			"</div></div>" + 
			"<div class='start-hidden internal-card-only' style='display:none;'><label>Interface:</label><div style='flex: 1 0 128px; min-width: 196px;'>" + 
				"<select style='width: calc(80% - 4px); min-width: auto;' class='shi-property smarthome-item-interface' data-shi-property='" + SEPIA_TAG_INTERFACE + "'>" +
					buildSmartHomeCustomHubOptions(shi.interface) +
				"</select>" + 
				"<button style='width: calc(20% - 4px); min-width: auto; margin: 8px 2px;' onclick='buildSmartHomeInterfaceEditor();'>EDIT</button>" + 
			"</div></div>" + 
			"<div class='start-hidden' style='display:none;'><label>State type:</label>" + "<select class='shi-property smarthome-item-state-type' data-shi-property='" + SEPIA_TAG_STATE_TYPE + "'>" +
					buildSmartHomeStateTypeOptions(shi.stateType) +
			"</select></div>" + 
			"<div class='start-hidden' style='display:none;'><label>Custom config:</label>" + 
				"<input class='shi-property smarthome-item-set-cmds' data-shi-property='" + SEPIA_TAG_SET_CMDS + "' style='font-size: 11px;' "
					+ "value='" + shiSetCmds + "' placeholder='e.g.: {\"enable\":\"on\", \"disable\":\"off\", \"number\":\"pct <val>\"}' type='text' title='For experts: Set custom commands used when writing a new state.'>" +
			"</select></div>" + 
		"</div>" +
		"<div class='smarthome-extend-body-btn'><div class='smarthome-extend-body-icon'>&#8250;</div></div>"
	;
	$(shiObj).append(shiObjContent);
	//is type guessed?
	if (shi.meta && shi.meta.typeGuessed){
		$(shiObj).find('.smarthome-item-type-confirm').show().on('click', function(){
			$(shiObj).find('.smarthome-item-type').trigger('change');
			$(this).hide();
		});
	}
	//extend button
	$(shiObj).find('.smarthome-extend-body-btn').on('click', function(){
		$(this).find('.smarthome-extend-body-icon').toggleClass('up');
		$(shiObj).find('.start-hidden').toggle();
	});
	//title
	$(shiObj).find('.smarthome-item-name').on('click', function(){
		$(shiObj).find('.smarthome-item-id').toggle();
	});
	$(shiObj).find('.shi-control-name').on('click', function(){
		shi = JSON.parse($(shiObj).attr('data-shi'));	//update shi obj first!
		if (refreshDelayTimer) clearTimeout(refreshDelayTimer);
		var newName = prompt("New name:", shi.name);
		if (newName){
			$(shiObj).find('.smarthome-item-name')
				.html(newName.replace("<", "&lt;").replace(">", "&gt;"))
				.attr("data-shi-value", newName)
				.trigger('change');
		}
	});
	//toggle button
	$(shiObj).find('.shi-control-toggle').on('click', function(){
		shi = JSON.parse($(shiObj).attr('data-shi'));	//update shi obj first!
		setSmartHomeItemState(shi);
	});
	//-- custom device --
	var $delBtn = $(shiObj).find('.shi-control-delete');
	var $saveBtn = $(shiObj).find('.shi-control-save');
	if (origin && origin == "internal"){
		$delBtn.show();
		$saveBtn.show();
		$saveBtn.closest(".smarthome-item").addClass('unsaved');
	}else{
		$(shiObj).find('.internal-card-only').remove();
	}
	//delete button
	$delBtn.on('click', function(){
		shi = JSON.parse($(shiObj).attr('data-shi'));	//update shi obj first!
		deleteSmartHomeItem(shi, function(){
			//success
			$(shiObj).remove();
		}, function(err){
			//fail
		});
	});
	if (itemId){
		$saveBtn.closest(".smarthome-item").removeClass('unsaved');
		$saveBtn.remove();
	}else{
		$saveBtn.on('click', function(){
			shi = JSON.parse($(shiObj).attr('data-shi'));	//update shi obj first!
			storeSmartHomeItem(shi, function(){
				//success
				$saveBtn.closest(".smarthome-item").removeClass('unsaved');
				$saveBtn.remove();
				activateSmartHomeItem(shiObj, true);
			}, function(err){
				//fail
			});
		});
	}
	return shiObj;
}
function buildSmartHomeInterfaceEditor(shi){
	if (!shi) shi = {
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
	interfaceEditor.innerHTML = "<h3>Interface Editor</h3>" +
		"<div style='display: flex; flex-direction: column;'>" + 
			"<label>Unique Name</label>" + 
				"<input class='smarthome-interface-id' spellcheck='true' placeholder='openHAB-2, FHEM_X, ...' value='" + shi.id + "'>" + 
			"<label>Interface Type</label>" + 
				"<select class='smarthome-interface-type'>" + buildSmartHomeInterfaceOptions(shi.type) + "</select>" + 
			"<label>Host Address</label>" + 
				"<input class='smarthome-interface-host' spellcheck='true' placeholder='http://localhost:8083/myHub' value='" + shi.host + "'>" + 
			"<label>Auth. Type (opt.)</label>" +
				"<input class='smarthome-interface-authType' spellcheck='true' placeholder='Basic' value='" + shi.authType + "'>" + 
			"<label>Auth. Data (opt.)</label>" + 
				"<input class='smarthome-interface-authData' spellcheck='true' placeholder='dXNlcjp0ZXN0MTIzNDU=' value='" + shi.authData + "'>" + 
			"<label>Description</label>" + 
				"<input class='smarthome-interface-desc' placeholder='Any info text ...' value='" + (shi.info? shi.info.desc : "") + "'>" + 
			"<div style='margin-top: 16px;'>" + 
				"<button class='smarthome-interface-btn-save'>SAVE</button>" + 
				"<button class='smarthome-interface-btn-delete' style='background: #f00;'>DELETE</button>" + 
			"</div>" +
		"</div>";
	ByteMind.ui.showPopup(interfaceEditor, config);
	var $ie = $(interfaceEditor);
	$ie.find('.smarthome-interface-btn-save').on('click', function(){
		createOrUpdateSmartHomeInterface(getSmartHomeInterfaceFromEditor(interfaceEditor),
		function(){
			//success
			ByteMind.ui.hidePopup();
			loadSmartHomeCustomInterfaces();
		},
		function(err){
			//fail
			alert("Failed to create smart home HUB interface! Check console for more info.");
		});
	});
	$ie.find('.smarthome-interface-btn-delete').on('click', function(){
		var q = confirm("Do you really want to delete this interface?");
		if (q){
			deleteSmartHomeInterface(getSmartHomeInterfaceFromEditor(interfaceEditor),
			function(){
				//success
				ByteMind.ui.hidePopup();
				loadSmartHomeCustomInterfaces();
			},
			function(err){
				//fail
				alert("Failed to delete smart home HUB interface! Check console for more info.");
			});
		}
	});
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
function buildSmartHomeTypeOptions(selected, addAllOption){
	var options = {
		"light" : "Light",
		"heater" : "Heater",
		"tv" : "TV",
		"music_player" : "Music Player",
		"roller_shutter" : "Roller Shutter",
		"power_outlet" : "Power Outlet",
		"sensor" : "Sensor",
		"fridge" : "Fridge",
		"oven" : "Oven",
		"coffee_maker" : "Coffee Maker",
		"device" : "Device",
		"other" : "Other",
		"hidden" : "Hidden"
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
function buildSmartHomeRoomOptions(selected){
	var options = {
		"livingroom" : "Living room",
		"diningroom" : "Dining room",
		"kitchen" : "Kitchen",
		"bedroom" : "Bedroom",
		"bath" : "Bath",
		"office" : "Office",
		"study" : "Study room",
		"childsroom" : "Child's room",
		"garage" : "Garage",
		"basement" : "Basement",
		"garden" : "Garden",
		"sunroom" : "Winter garden",
		"hallway" : "Hallway",
		"shack" : "Shack",
		"other" : "Other",
		"unassigned" : "Not assigned"
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
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}, function(optionsObj){
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	});
}

//------- build some stuff for DOM --------

loadSmartHomeGetDevicesFilter();
