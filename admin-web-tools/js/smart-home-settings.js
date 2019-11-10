//------ INTERFACE: ------

var smartHomeSystem = "";
var smartHomeServer = "";

var SEPIA_TAG_NAME = "sepia-name";
var SEPIA_TAG_TYPE = "sepia-type";
var SEPIA_TAG_ROOM = "sepia-room";
var SEPIA_TAG_DATA = "sepia-data";
var SEPIA_TAG_MEM_STATE = "sepia-mem-state";

function smartHomeOnStart(){
	smartHomeSystem = sessionStorage.getItem('smartHomeSystem');
	if (smartHomeSystem){
		if (hasSelectedKnownSmartHomeSystem(smartHomeSystem)){
			$('#smarthome_system_select').val(smartHomeSystem);
		}else{
			$('#smarthome_system_select').val('custom');
			$('#smarthome_system_custom_select').val(smartHomeSystem);
			$('#smarthome_system_custom').show();
		}
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
	//change listener
	$('#smarthome_system_select').on('change', function(){
		$('#smarthome-server-indicator').removeClass('secure');
		$('#smarthome-server-indicator').removeClass('inactive');
		if (this.value == "custom"){
			$('#smarthome_system_custom').show();
		}else{
			$('#smarthome_system_custom').hide();
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
		sessionStorage.setItem('smartHomeSystem', system);
		smartHomeSystem = system;
	}else{
		sessionStorage.setItem('smartHomeSystem', "");
	}
	return system;
}
function getSmartHomeServer(successCallback, errorCallback){
	var host = $('#smarthome-server').val();
	if (host){
		sessionStorage.setItem('smartHomeServer', host);
		smartHomeServer = host;
		if (successCallback) successCallback(host);
	}else{
		sessionStorage.setItem('smartHomeServer', "");
		smartHomeServer = "";
		if (errorCallback) errorCallback();
	}
	return host;
}
function getSmartHomeHubDataFromServer(){
	var body = {};
	genericPostRequest("assist", "integrations/smart-home/getConfiguration", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log(data);
			data.hubName = data.hubName.toLowerCase();
			$('#smarthome_system_select').val(data.hubName);
			$('#smarthome-server').val(data.hubHost);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
		}
	);
}

function getSmartHomeDevices(successCallback, errorCallback){
	$('#smarthome-devices-list').html("");
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		deviceTypeFilter: $('#smarthome-devices-filter').val()
	};
	genericPostRequest("assist", "integrations/smart-home/getDevices", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
			$('#smarthome-devices-last-refresh').html('- last refresh:<br>' + 
				'<button onclick="getSmartHomeDevices();">' + new Date().toLocaleTimeString() + ' <i class="material-icons md-btn" style="vertical-align:bottom;">refresh</i></button>'
			);
			var devices = data.devices;
			var hiddenDevices = 0;
			if (devices && devices.length > 0){
				//build DOM objects
				devices.forEach(function(item){
					var domObj = buildSmartHomeItem(item);
					if (domObj){
						$('#smarthome-devices-list').append(domObj);
						if (item.type == "hidden"){
							$(domObj).addClass("hidden");
							hiddenDevices++;
						}
					}
				});
				//hidden items?
				if (hiddenDevices > 0){
					var showHiddenBtn = document.createElement("button");
					showHiddenBtn.id = "smarthome-devices-list-show-hidden-btn";
					showHiddenBtn.innerHTML = "Show " + hiddenDevices + " hidden devices";
					$('#smarthome-devices-list').append(showHiddenBtn);
					$(showHiddenBtn).on('click', function(){
						$('.smarthome-item.hidden').toggle();
					});
				}
				//add button listeners
				$('.shi-property').on('change', function(){
					var that = this;
					var $item = $(this).closest('.smarthome-item');
					var property = $(this).attr('data-shi-property');
					//console.log(property);
					var newVal = $(this).attr('data-shi-value') || $(this).val();
					var shiString = $item.attr('data-shi');
					if (shiString){
						var shi = JSON.parse(shiString);
						putSmartHomeItemProperty(shi, property, newVal, function(){
							//$(that).attr('data-shi-value', newVal);
							$item.attr('data-shi', JSON.stringify(shi));
						});
					}
				});
			}else{
				alert("No devices found.");
			}
			if (successCallback) successCallback(devices);
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
			alert("No items found or no access to smart home system.");
			if (errorCallback) errorCallback(data);
		}
	);
}

function registerSepiaInsideSmartHomeHub(){
	//$('#smarthome-devices-list').html("");
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost
	};
	genericPostRequest("assist", "integrations/smart-home/registerFramework", body,
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			//console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
			
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
		}
	);
}

function putSmartHomeItemProperty(shi, property, value, successCallback, errorCallback){
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
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
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
			console.log("Smart home item: " + shi.name + ", changed '" + property + "' to: " + value);
			//refresh attributes
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
				default:
					console.error("Smart Home Device property unknown: " + property);
			}
			//TODO: refresh UI?
			if (successCallback) successCallback();
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
			var msg = "Smart home item: " + shi.name + ", FAILED to change '" + property + "' to: " + value;
			console.log(msg);
			alert(msg);
			if (errorCallback) errorCallback();
		}
	);
}
function deleteSmartHomeItemProperty(shi, property, successCallback, errorCallback){
	//TODO: for now we just set value to empty
	putSmartHomeItemProperty(shi, property, "", successCallback, errorCallback);
}

function setSmartHomeItemState(shi){
	console.log(shi);
	//alert("Coming soon :-)");
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}
	var newVal;
	var oldVal = shi.state.toLowerCase();
	var deviceType = shi.type;
	var stateType = "text_binary";	//shi["state-type"]
	switch (oldVal) {
		case "off":
			newVal = "on";
			break;
		case "on":
			newVal = "off";
			break;
		case "open":
			newVal = "closed";
			break;
		case "closed":
			newVal = "open";
			break;
		default:
			if (!!oldVal.match(/^\d+$/)){
				if (deviceType == 'roller_shutter'){
					newVal = "closed";
				}else{
					//TODO: this might be too general
					newVal = "off";
				}
			}
	}
	if (newVal == undefined){
		alert("Coming soon :-)");
		return;
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

function buildSmartHomeItem(shi){
	var shiObj = document.createElement("div");
	shiObj.className = "smarthome-item";
	shiObj.setAttribute("data-shi", JSON.stringify(shi));
	var itemName = shi.name;
	var itemId = shi.meta.id;
	var shiObjContent = "" +
		"<div class='smarthome-item-title'>" + 
			"<div style='overflow:hidden;'>" +
				"<span class='shi-property smarthome-item-name' data-shi-property='" + SEPIA_TAG_NAME + "' data-shi-value='" + itemName + "'>" + itemName.replace("<", "&lt;").replace(">", "&gt;") + "</span>" +
				"<span class='smarthome-item-id'> - " + itemId.replace("<", "&lt;").replace(">", "&gt;") + "</span>" +
			"</div>" +
			"<div style='display:flex;'>" +
				"<button class='shi-control-name'><i class='material-icons md-18'>edit</i></button>" +
				"<button class='shi-control-toggle'><i class='material-icons md-18'>power_settings_new</i></button>" +
			"</div>" +
		"</div>" +
		"<div class='smarthome-item-body'>" + 
			"<div><label>State:</label>" + "<span class='shi-info smarthome-item-state'>" + shi.state + "</span></div>" + 
			"<div><label>Type:</label>" + "<select class='shi-property smarthome-item-type' data-shi-property='" + SEPIA_TAG_TYPE + "'>" +
					buildSmartHomeTypeOptions(shi.type, false) +
			"</select></div>" + 
			"<div><label>Room:</label>" + "<select class='shi-property smarthome-item-room' data-shi-property='" + SEPIA_TAG_ROOM + "'>" +
					buildSmartHomeRoomOptions(shi.room) +
			"</select></div>" + 
		"</div>"
	;
	$(shiObj).append(shiObjContent);
	$(shiObj).find('.smarthome-item-name').on('click', function(){
		$(shiObj).find('.smarthome-item-id').toggle();
	});
	$(shiObj).find('.shi-control-name').on('click', function(){
		var newName = prompt("New name:", shi.name);
		if (newName){
			$(shiObj).find('.smarthome-item-name')
				.html(newName.replace("<", "&lt;").replace(">", "&gt;"))
				.attr("data-shi-value", newName)
				.trigger('change');
		}
	});
	$(shiObj).find('.shi-control-toggle').on('click', function(){
		setSmartHomeItemState(shi);
	});
	return shiObj;
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
	var optionsObj = "";
	foundSelected = false;
	for (o in options){
		var oName = options[o];
		if (o == selected){
			optionsObj += "<option value='" + o + "' selected>" + oName + "</option>";
			foundSelected = true;
		}else{
			optionsObj += "<option value='" + o + "'>" + oName + "</option>";
		}
	}
	if (foundSelected){
		if (addAllOption){
			return ("<option value='' disabled>- Choose -</option><option value=''>All</option>" + optionsObj);
		}else{
			return ("<option value='' disabled>- Choose -</option>" + optionsObj);
		}
	}else{
		if (addAllOption){
			return ("<option value='' disabled selected>- Choose -</option><option value=''>All</option>" + optionsObj);
		}else{
			return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
		}
	}
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
		"garage" : "Garage",
		"basement" : "Basement",
		"garden" : "Garden",
		"hallway" : "Hallway",
		"shack" : "Shack"
	}
	var optionsObj = "";
	var foundSelected = false;
	for (o in options){
		var oName = options[o];
		if (o == selected){
			optionsObj += "<option value='" + o + "' selected>" + oName + "</option>";
			foundSelected = true;
		}else{
			optionsObj += "<option value='" + o + "'>" + oName + "</option>";
		}
	}
	if (foundSelected){
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}else{
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	}
}

//------- build some stuff for DOM --------

loadSmartHomeGetDevicesFilter();
