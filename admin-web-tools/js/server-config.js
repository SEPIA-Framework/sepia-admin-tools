//send server config request to assist API
function serverConfigRequest(requestBody, successCallback, errorCallback){
	if (!successCallback) successCallback = function(data){
		showMessage(JSON.stringify(data, null, 2));
	}
	if (!errorCallback) errorCallback = function(data){
		showMessage(JSON.stringify(data, null, 2));
	}
	genericFormPostRequest("assist", "config", requestBody, successCallback, errorCallback);
}

function softRestartServer(){
	var body = {
		restartServer: true
	}
	serverConfigRequest(body);
}

function getAdHocServerConfig(){
	serverConfigRequest({});
}
function getFullServerConfig(){
	var body = {
		getConfig: "all"
	}
	var buildConfigList = function(data){
		//success
		if (data && data.config && data.config.length > 0){
			var $listbox = $('#settings-list-box');
			$listbox.html('<p class="info-text">Change settings entry and press confirm to write changes to server.<br>Will take effect after server reload (see below).</p>');
			$listbox.css({paddingBottom: "16px"});
			for (var i=0; i<data.config.length; i++){
				var setting = data.config[i];
				var k = setting.substring(0, setting.indexOf('='));
				var v = setting.substring(setting.indexOf('=') + 1);
				var entry = document.createElement('div');
				entry.className = "settings-list-entry";
				entry.innerHTML = "<div>" + k + "</div><div>=</div><div><input value='" + v + "' data-entry-name=" + k + " onchange='writeEntryChangeToServerConfig(this);'>" 
						+ "</div><div class='settings-list-confirm-btn' title='Confirm change?'>&#10003;</div>";
				$listbox.append(entry);
			}
		}
	};
	serverConfigRequest(body, buildConfigList, function(data){
		//error
		$('#settings-list-box').html('');
		showMessage(JSON.stringify(data, null, 2));
	});
}
function getSpecificServerConfig(key, successCallback, errorCallback){
	if (!key) key = $('#settings-write-kvpair-k').val();
	var body = {
		getConfig: key
	}
	serverConfigRequest(body, successCallback, errorCallback);
}
/* Example:
getSpecificServerConfig("smarthome_hub_", function(data){
	$('#smarthome_system_select').val('');
	$('#smarthome-server').val('');
	var hubData = data.config;
	if (hubData && hubData.length >= 2){
		hubData.forEach(function(hd){
			if (hd.indexOf("smarthome_hub_name=") == 0){
				$('#smarthome_system_select').val(hd.split("=")[1]);
			}else if (hd.indexOf("smarthome_hub_host=") == 0){
				$('#smarthome-server').val(hd.split("=")[1]);
			}
		});
	}else{
		showMessage(JSON.stringify(data, null, 2));
	}
}); */
function writeEntryChangeToServerConfig(ele){
	$(ele).closest('.settings-list-entry').find('.settings-list-confirm-btn').show().off().on('click', function(){
		//console.log(ele.dataset.entryName);
		//console.log(ele.value);
		$(this).hide();
		sendKeyValueToServerConfig(ele.dataset.entryName, ele.value)
	});	
}
function writeKeyValueToServerConfig(){
	var k = $('#settings-write-kvpair-k').val();
	var v = $('#settings-write-kvpair-v').val();
	sendKeyValueToServerConfig(k, v);
}
function sendKeyValueToServerConfig(k, v){
	if (k && v != undefined){
		var d = {};
		d[k] = v;
		var body = {
			"setConfig": JSON.stringify(d)
		};
		serverConfigRequest(body);
	}
}
function toggleServerAnswers(){
	var body = {
		"answers" : "toggle"
	}
	serverConfigRequest(body);
}
function toggleSdk(){
	var body = {
		"sdk" : "toggle"
	}
	serverConfigRequest(body);
}
function toggleSentencesDb(){
	var body = {
		"useSentencesDB" : "toggle"
	}
	serverConfigRequest(body);
}
function cleanEmailBcc(){
		var body = {
		"setEmailBCC" : "remove"
	}
	serverConfigRequest(body);
}
function reloadDatabaseIndex(){
	var dbReloadCmd = $('#settings-db-reload').val();
	var body = {
		"reloadDB" : dbReloadCmd
	}
	serverConfigRequest(body);
}

//-------- SDK ---------

//Get services upload form
function getServicesUpload(){
	var link = getServer("assist") + "upload-service";
	genericGetRequest(link, function(data){
		showMessage(data, true);
		//change post action to correct server
		$('#upload-service-box').find('form').attr('action', link);
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}