//------ INTERFACE: ------

var smartHomeSystem = "";
var smartHomeServer = "";

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

//DEVICE OBJECT
function SmartHomeItem(name, type, room, groups, link){
	this.name = name;
	this.type = type;
	this.room = room;
	this.groups = groups;
	this.link = link;
}

function hasSelectedKnownSmartHomeSystem(sys){
	var isOption = false;
	$('#smarthome_system_select').each(function(){
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
		hubHost: hubHost
	};
	genericPostRequest("assist", "integrations/smart-home/getDevices", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
			var devices = data.devices;
			if (devices && devices.length > 0){
				//build DOM objects
				devices.forEach(function(item){
					var domObj = buildSmartHomeItem(item);
					if (domObj){
						$('#smarthome-devices-list').append(domObj);
					}
				});
				//add button listeners
				$('.shi-property').off().on('change', function(){
					var $item = $(this).closest('.smarthome-item');
					var property = $(this).attr('data-shi-property');
					//console.log(property);
					var newVal = $(this).val();
					var shiString = $item.attr('data-shi');
					if (shiString){
						var shi = JSON.parse(shiString);
						putSmartHomeItemProperty(shi, property, newVal, function(){
							console.log("Smart home item: " + shi.name + ", changed '" + property + "' to: " + newVal);
							$item.attr('data-shi', JSON.stringify(shi));
						}, function(){
							var msg = "Smart home item: " + shi.name + ", FAILED to change '" + property + "' to: " + newVal;
							console.log(msg);
							alert(msg);
						});
					}
				});
			}else{
				alert("No devices found.");
			}
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
			alert("No items found or no access to smart home system.");
		}
	);
}

function registerSepiaInsideSmartHomeHub(){
	$('#smarthome-devices-list').html("");
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
	if (getSmartHomeSystem() == "openhab"){
		openHabPutItemTag(shi, property, value, successCallback, errorCallback);
	}else{
		console.error("Unsupported smart home system: " + smartHomeSystem);
	}
}

function deleteSmartHomeItemProperty(shi, property, successCallback, errorCallback){
	if (getSmartHomeSystem() == "openhab"){
		openHabDeleteItemTag(shi, property, value, successCallback, errorCallback);
	}else{
		console.error("Unsupported smart home system: " + smartHomeSystem);
	}
}

//------ DOM ------

function buildSmartHomeItem(shi){
	var shiObj = "<div class='smarthome-item' data-shi='" + JSON.stringify(shi) + "'>" +
		"<div class='smarthome-item-title'>" + shi.name.replace("<", "&lt;").replace(">", "&gt;") + "</div>" +
		"<div class='smarthome-item-body'>" + 
			"<div><label>Type:</label>" + "<select class='shi-property smarthome-item-type' data-shi-property='type'>" +
					buildSmartHomeTypeOptions(shi.type) +
			"</select></div>" + 
			"<div><label>Room:</label>" + "<select class='shi-property smarthome-item-room' data-shi-property='room'>" +
					buildSmartHomeRoomOptions(shi.room) +
			"</select></div>" + 
		"</div>" +
	"</div>";
	return shiObj;
}
function buildSmartHomeTypeOptions(selected){
	var options = {
		"light" : "Light",
		"heater" : "Heater",
		"device" : "Device"
		/* ---tbd---
		"tv" : "TV",
		"music_player" : "Music Player",
		"fridge" : "Fridge",
		"oven" : " "Oven",
		"coffee_maker" : "Coffee Maker",
		*/
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
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}else{
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
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

//------ old interface -------

function checkSmartHomeServer(_host){
	var host = _host || getSmartHomeServer();
	if (!host){
		$('#smarthome-server-indicator').removeClass('secure'); 	//secure = connected (in this case)
		$('#smarthome-server-indicator').addClass('inactive');
		return;
	}
	if (getSmartHomeSystem() == "openhab"){
		openHabCheckConnection(host, function(){
			//success
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
		}, function(){
			//error
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
		});
		
	}else{
		console.error("Unsupported smart home system: " + smartHomeSystem);
	}
}
function legacyGetSmartHomeDevices(successCallback, errorCallback){
	$('#smarthome-devices-list').html("");
	var host = getSmartHomeServer();
	if (!host){
		showMessage('Error: missing server');
		return;
	}
	if (getSmartHomeSystem() == "openhab"){
		checkSmartHomeServer(host);
		openHabGetItems(host, function(data){
			//showMessage(JSON.stringify(data, null, 2));
			if (data && data.length > 0){
				//build DOM objects
				data.forEach(function(item){
					var domObj = buildSmartHomeItem(item);
					if (domObj){
						$('#smarthome-devices-list').append(domObj);
					}
				});
				//add button listeners
				$('.shi-property').off().on('change', function(){
					var $item = $(this).closest('.smarthome-item');
					var property = $(this).attr('data-shi-property');
					//console.log(property);
					var newVal = $(this).val();
					var shiString = $item.attr('data-shi');
					if (shiString){
						var shi = JSON.parse(shiString);
						putSmartHomeItemProperty(shi, property, newVal, function(){
							console.log("Smart home item: " + shi.name + ", changed '" + property + "' to: " + newVal);
							$item.attr('data-shi', JSON.stringify(shi));
						}, function(){
							var msg = "Smart home item: " + shi.name + ", FAILED to change '" + property + "' to: " + newVal;
							console.log(msg);
							alert(msg);
						});
					}
				});
			}
		}, function(e){
			alert("No items found or no access to smart home system.");
		});
		
	}else{
		console.error("Unsupported smart home system: " + smartHomeSystem);
	}
}

//------ openHAB ------

function openHabCheckConnection(host, successCallback, errorCallback){
	if (!endsWith(host, "/"))	host += "/";
	httpRequest(host + "rest/", successCallback, function(){
		showMessage('Result: error <br>'
			+ 'If you see a CORS/CORB warning you might need to add<br>'
			+ '"org.eclipse.smarthome.cors:enable=true" to /etc/openhab2/services/runtime.cfg'
		, true);
		if (errorCallback) errorCallback();
	}, "GET", "", "");
}

function openHabGetItems(host, successCallback, errorCallback){
	//TODO
	if (!endsWith(host, "/"))	host += "/";
	httpRequest(host + "rest/items?recursive=false", function(data){
		var items = [];
		//console.log(data);
		if (data && data.length > 0){
			data.forEach(function(item){
				//console.log(item);
				var name = item.name;
				var type = openHabGetFromSepiaTags("type", item.tags);
				var room = openHabGetFromSepiaTags("room", item.tags);
				var groups = item.groupNames;
				console.log("Smart home item - Name: " + name + ", type: " + type + ", room: " + room);
				var shi = new SmartHomeItem(
					name, 
					type,
					room,
					groups,
					item.link
				);
				items.push(shi);
			});
		}
		successCallback(items);
	}, errorCallback);
}
function openHabGetFromSepiaTags(key, tags){
	for (var i=0; i<tags.length; i++){
		var thisTag = tags[i];
		if (thisTag.indexOf("sepia-" + key) == 0){
			var returnTag = thisTag.replace(/.*?=/, "");
			return returnTag;
		}
	}
	return "";
}
function openHabPutItemTag(shi, tag, value, successCallback, errorCallback){
	if (!shi.link){
		if (errorCallback) errorCallback("No link to smart home item REST API found!");
		return;
	}
	//clean up tags first
	openHabDeleteItemTag(shi, tag, function(res){
		var fullTag = "sepia-" + tag + "=" + value;
		var itemLink = shi.link;
		if (!endsWith(itemLink, "/"))	itemLink += "/";
		httpRequest(itemLink + "tags/" + fullTag, successCallback, errorCallback, "PUT");
	}, errorCallback);
}
function openHabDeleteItemTag(shi, tag, successCallback, errorCallback){
	if (!shi.link){
		if (errorCallback) errorCallback("No link to smart home item REST API found!");
		return;
	}
	//Get all tags and delete all "sepia-[tag]=..." ones
	httpRequest(shi.link, function(data){
		var tags = data.tags;
		//console.log(tags);
		if (tags && tags.length > 0){
			var hits = [];
			tags.forEach(function(t){
				if (t.indexOf("sepia-" + tag + "=") == 0){
					hits.push(t);
				}
			});
			var n = 0;
			var itemLink = shi.link;
			if (!endsWith(itemLink, "/"))	itemLink += "/";
			hits.forEach(function(t){
				httpRequest(itemLink + "tags/" + t, function(res){
						console.log("Smart home item: " + shi.name + ", removed: " + t);
						n++;
						if (n == hits.length){
							if (successCallback) successCallback();
						}
				}, function(e){
						console.log("Smart home item: " + shi.name + ", FAILED to remove: " + t);
						n++;
						if (n == hits.length){
							if (errorCallback) errorCallback();
						}
				}, "DELETE");
			});
		}
	}, errorCallback);
}