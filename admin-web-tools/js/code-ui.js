var codeEditor;
var extensionType;					//currently either "smart-service" or "mesh-plugin"
var servicesDataArray = {}; 		//actually it is an object with arrays not an array ^^
var meshPluginsDataArray = {};		//	""		""		""
var onlineRepository = "https://raw.githubusercontent.com/SEPIA-Framework/sepia-extensions/master";

//Setup CodeMirror
function codeUiOnReady(){
	//Initialize editor
	var codeContainer = document.getElementById('code-ui-code-box-container');
	codeEditor = CodeMirror.fromTextArea(document.getElementById("code-ui-code-box"), {
		lineNumbers: true,
		matchBrackets: true,
		mode: "text/x-java",
		theme: "sepia-fw",
		//theme: (sepiaControlHubActiveSkin == 2? "default": "sepia-fw"),
		dragDrop: true,
		allowDropFileTypes: ["text/x-java"]
	});
	codeEditor.setSize(codeContainer.offsetWidth, codeContainer.offsetHeight);
	codeEditor.setValue(document.getElementById('code-ui-source-code').value || document.getElementById('source-code').value);
	
	//Auto-resize editor
	window.addEventListener('resize', function(){
		codeEditor.setSize(codeContainer.offsetWidth, codeContainer.offsetHeight);
	});
	
	//Listen to paste event
	$(codeContainer).find("textarea").each(function(i, ta){
		ta.addEventListener("paste", function(event){
			var paste = (event.clipboardData || window.clipboardData).getData('text');
			if (paste){
				var cName = paste.match(/public class (.*) implements ServiceInterface/g);
				if (cName && cName.length == 1){
					$('#code-ui-source-class-name').val(cName[0].replace(/.*public class (.*?) implements ServiceInterface.*/, "$1").trim());
				}
			}
		});
	});

	//Fill id/pwd/server form
	codeUiUpdateFormData();
	
	console.log("Code-UI - CodeMirror editor is ready");
}

//Get submit URL
function codeUiBuildSubmitURL(){
	codeEditor.save();
	var code = codeEditor.getValue();
	if (!code){
		alert("Please add some code first! ;-)");
		return false;
	}else{
		//codeUiUpdateFormData();
		codeUiValidateAndSetSourceCode(code);
	}
	var server;
	var serverType = "";
	var endpoint = "";
	if (extensionType == "smart-service"){
		if (!$('#code-ui-id').val()){
			alert("You need to be logged in to upload a service!");
			return false;
		}
		serverType = 'assist';
		endpoint = 'upload-service';
	}else{
		serverType = 'mesh-node';
		endpoint = 'upload-plugin';
	}
	if ('getServer' in window){
		if (extensionType){
			server = getServer(serverType);
		}else{
			server = "/"; 	//this can not happen in normal flow
			uploadform.action = "";
		}
	}else{
		server = document.getElementById("server").value;
	}
	return (server + endpoint);
}
//Upload code
function codeUiUploadCode(){
	event.preventDefault();
	
	var uploadform = document.getElementById('code-ui-upload-form');
	var uploadUrl = codeUiBuildSubmitURL();		//handle storage and checks as well
	if (!uploadUrl){
		return false;
	}
	uploadform.action = uploadUrl;		//NOTE: probably not required
	var formData = new FormData(uploadform);
	
    var xhr = new XMLHttpRequest();
	xhr.addEventListener("loadstart", function(event){
		//onstart
		showMessage("Uploading code ...");
    });
    xhr.addEventListener("load", function(event){
		//success
		console.log("Code upload - LOG - status:", event && event.target && event.target.statusText);
		try {
			var res = event.target.responseText || event.target.response;
			if (res){
				res = res.trim();
				if (res.indexOf("{") == 0){
					res = JSON.parse(res);
					showMessage(JSON.stringify(res, null, 2));
				}else{
					showMessage(res);
				}
			}
		}catch(err){
			console.error("Code upload - ERROR", err);
			showMessage("Failed to handle response. See console log.");
		}
    });
    xhr.addEventListener("error", function(err){
		//error
		console.error("Code upload - ERROR", err);
		//showMessage(JSON.stringify(err, null, 2));
		showMessage("Failed to upload code, error: " + (err && err.type));
    });
    //Send data
    xhr.open("POST", uploadUrl);
    xhr.send(formData);
}

//Fill id/pwd/server form (from shared.js)
function codeUiUpdateFormData(){
	if ('ByteMind' in window){
		$('#code-ui-id').val(userid);
		$("#code-ui-pwd").prop("disabled", true);	
		$('#code-ui-key').val(getKey());
		$('#code-ui-client').val(client_info);
		if (ByteMind.webservice){
			$('#code-ui-server').val(ByteMind.webservice.apiURL);
		}
	}else{
		$("#code-ui-key").prop("disabled", true);
		$("#code-ui-key").hide();
	}
}

//Run when extension type changes
function codeUiExtensionTypeChange(){
	codeUiUpdateFormData();
	extensionType = $('#code-ui-extension-type').val();
	$('#code-ui-upload-btn').fadeIn(300);
	$('#code-ui-load-repo-btn').fadeIn(300);
	console.log("Extension typ is: " + extensionType);
	//Update extension name select
	if (extensionType == "smart-service"){
		codeUiBuildExtensionNameOptions(servicesDataArray);
	}else{
		codeUiBuildExtensionNameOptions(meshPluginsDataArray);
	}
}
function codeUiSetExtensionType(newType){
	$('#code-ui-extension-type').val(newType);
	codeUiExtensionTypeChange();
}

//Update extension select and class name
function codeUiUpdateExtension(){
	//Extension select value
	var name = $('#code-ui-extension-name').val();
	//Code
	if (name){
		var dataArray;
		if (extensionType == "smart-service"){
			dataArray = servicesDataArray;
		}else{
			dataArray = meshPluginsDataArray;
		}
		if (dataArray && dataArray.hasOwnProperty(name)){
			var code = dataArray[name].code;
			if (code){
				codeUiValidateAndSetSourceCode(code);
				$('#code-ui-source-class-name').val(name);
				console.log("Extension loaded: " + name);

			}else if (dataArray[name].path){
				codeUiLoadCodeFromServer(name, dataArray[name].path, function(data){
					codeUiValidateAndSetSourceCode(data);
					$('#code-ui-source-class-name').val(name);
					console.log("Extension loaded: " + name);
				});
			
			}else{
				showMessage("Failed to load extensions! Missing 'code' or 'path to code'.");
			}
		}
	}
}
//Triggered when class name was changed
function codeUiUpdatedClassName(){
	//console.log('Class name updated');
}
//Build extension select options
function codeUiBuildExtensionNameOptions(data){
	var html;
	if (data && Object.keys(data).length > 0){
		html = '<option value="" selected disabled>Select</option>';
		$.each(data, function(i, opt){
			html += sanitizeHtml('<option value="' + opt.name + '">' + opt.name + '</option>');
		});
	}else{
		html = '<option value="" selected disabled>Load please</option>';
	}
	$('#code-ui-extension-name').html(html);
}

//Open a local source file
function codeUiOpenSourceFile(event){
	if (event && event.target){
		var input = event.target;
		var reader = new FileReader();
		var fileName = input.files[0].name;
		console.log("Extension file loading: " + fileName);
		reader.onload = function(){
			var dataArray = {};
			var name = fileName.replace(/\..*?$/, "").trim();
			dataArray[name] = {
				"name" : name,
				"code" : reader.result,
				"path" : ""
			};
			if (extensionType == "smart-service"){
				servicesDataArray = dataArray;
			}else{
				meshPluginsDataArray = dataArray;
			}
			codeUiBuildExtensionNameOptions(dataArray);
			$('#code-ui-extension-name').val(name);
			codeUiUpdateExtension();
			//console.log(reader.result.substring(0, 200));
			$('#code-ui-file-input').val('');	//reset so it works when loading same file again
		};
		reader.readAsText(input.files[0]);
	}
}
//Load a configuration file from online repository
function codeUiLoadExtensionConfigFromServer(){
	$('#code-ui-online-extensions-list').show(300);
	var link;
	if (extensionType == "smart-service"){
		link = onlineRepository + "/smart-services/smart-services.json";
	}else{
		link = onlineRepository + "/mesh-plugins/mesh-plugins.json";
	}
	genericGetRequest(link, function(data){
		//showMessage(JSON.stringify(data, null, 2));	//debug

		//convert array to object
		var dataArray;
		if (extensionType == "smart-service"){
			dataArray = data.services;
		}else{
			dataArray = data.plugins;
		}
		var dataObject = {};
		$.each(dataArray, function(i, obj){
			if (obj.name){
				dataObject[obj.name] = obj;
			}
		});
		if (extensionType == "smart-service"){
			servicesDataArray = dataObject;
		}else{
			meshPluginsDataArray = dataObject;
		}
		codeUiBuildExtensionNameOptions(dataObject);

	}, function(data){
		showMessage("Failed to load extensions from SEPIA online repository! Plz check: https://github.com/SEPIA-Framework/sepia-extensions");
	});
}
//Load code from server
function codeUiLoadCodeFromServer(name, path, callback){
	if (extensionType == "smart-service"){
		path = "/smart-services/" + path;
	}else{
		path = "/mesh-plugins/" + path;
	}
	var link = onlineRepository + path;
	genericGetRequest(link, function(data){
		//update arrays
		if (extensionType == "smart-service"){
			servicesDataArray[name].code = data;
		}else{
			meshPluginsDataArray[name].code = data;
		}
		console.log("Extension code loaded from server for: " + path);
		//callback?
		callback(data);

	}, function(data){
		showMessage("Failed to load " + path + " from SEPIA online repository! Plz check: https://github.com/SEPIA-Framework/sepia-extensions");
	});
}

//Before we add code we should check the package name at least
function codeUiValidateAndSetSourceCode(code){
	codeUiUpdateFormData();
	if (code){
		//choose correct extension type
		if (code.indexOf("implements ServiceInterface") > 0){
			codeUiSetExtensionType("smart-service");
		}
		//replace package?
		if (extensionType == "smart-service"){
			code = code.replace(/(^package .*\.)(.*?)(;)/mi, "$1" + ($('#code-ui-id').val() || "[your_user_ID]") + "$3");
		}
		codeEditor.setValue(code);
	}
}

//Download as text-file
function codeUiTriggerScriptDownload(){
	if (codeEditor){
		var code = codeEditor.getValue();
		var fileName = $('#code-ui-source-class-name').val() || "NewClass";
		fileName = fileName + ".java";
		var textFileAsBlob = new Blob([code], {type:'text/plain'}); 
		if (window.navigator && window.navigator.msSaveOrOpenBlob){
			//IE11 support
			window.navigator.msSaveOrOpenBlob(textFileAsBlob, fileName);
		}else{
			var downloadLink = document.createElement("a");
			downloadLink.download = fileName;
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
			downloadLink.click();
		}
	}
}

//Custom services manager
function buildCustomServicesManager(){
	var config = {
		useSmallCloseButton: true
	}
	var serviceManager = document.createElement("div");
	serviceManager.innerHTML = "<h3>User Commands and Services</h3>";
	ByteMind.ui.showPopup(serviceManager, config);
	//fill manager with content
	genericPostRequest("assist", "get-services", {}, function(res){
		//Success
		if (!res || res.result != "success" || !res.commandsAndServices){
			//Unexpected fail
			var msg = document.createElement("p");
			msg.innerHTML = "- Failed to load custom services -";
			$(serviceManager).append(msg);
			console.error("buildCustomServicesManager - ERROR", res);
			
		}else if (res.commandsAndServices.length == 0){
			//Empty
			var msg = document.createElement("p");
			msg.innerHTML = "- User has no custom services -";
			$(serviceManager).append(msg);
			
		}else{
			var $serviceManager = $(serviceManager);
			res.commandsAndServices.forEach(function(item){
				var cmd = item.command;
				var services = item.services;
				if (cmd && services && services.length > 0){
					var itemEle = document.createElement("div");
					itemEle.className = "custom-service-item";
					
					var openBtn = document.createElement("button");
					openBtn.className = "custom-service-open-btn";
					var name = cmd.replace(/.*\./, "").replace(/_/, " ").replace(/\s+/, " ").trim().toUpperCase();
					var primaryService = services[0].replace(/.*\./, "").trim();
					openBtn.innerHTML = "Command: " + name + "<br>Service: <b>" + primaryService + "</b>";
					//btn.title = "Connected services: " + JSON.stringify(services);
					//load source code
					$(openBtn).on('click', function(){
						getCustomServiceSourceCode(primaryService, function(sourceRes){
							//load source code to editor
							codeUiValidateAndSetSourceCode(sourceRes.sourceCode);
							$('#code-ui-source-class-name').val(primaryService);
							codeUiSetExtensionType("smart-service");
							console.log("Service loaded: " + primaryService);
							ByteMind.ui.hidePopup();
							
						}, function(sourceErr){
							//show source code error
							ByteMind.ui.hidePopup();
						});
					});
					
					var delBtn = document.createElement("button");
					delBtn.className = "custom-service-delete-btn";
					delBtn.innerHTML = '<i class="material-icons md-24">delete</i>';
					//delete
					$(delBtn).on('click', function(){
						removeCustomServiceForUser(cmd, primaryService, function(){
							//remove item
							$(itemEle).fadeOut(300, function(){
								$(this).remove();
							});
						}, function(){
							//show error
							ByteMind.ui.hidePopup();
						});
					});
					
					$serviceManager.append(itemEle);
					$(itemEle).append(openBtn).append(delBtn);
				}else{
					console.error("buildCustomServicesManager - item ERROR", item);
				}
			});
		}
	}, function(err){
		//Fail
		var msg = document.createElement("p");
		msg.innerHTML = "- Failed to load custom services -";
		$(serviceManager).append(msg);
	});
}

function getCustomServiceSourceCode(serviceName, successCallback, errorCallback){
	genericPostRequest("assist", "get-service-source", {
		service: serviceName
	}, function(res){
		if (!res || res.result != "success" || !res.sourceCode){
			//Unexpected fail
			console.error("getCustomServiceSourceCode - ERROR", res);
			showMessage(JSON.stringify(res, null, 2));
			if (errorCallback) errorCallback(res);
		}else{
			//Success
			//showMessage(JSON.stringify(res, null, 2));
			console.log("getCustomServiceSourceCode - SUCCESS, code length:", res.sourceCode.length);
			if (successCallback) successCallback(res);
		}
	}, function(err){
		//Fail
		showMessage(JSON.stringify(err, null, 2));
		if (errorCallback) errorCallback(err);
	});
}
function removeCustomServiceForUser(commandName, primaryServiceName, successCallback, errorCallback){
	var cmds = [commandName];
	var services = [primaryServiceName];
	genericPostRequest("assist", "delete-service", {
		commands: cmds,
		services: services
	}, function(res){
		if (!res || res.result != "success"){
			//Unexpected fail
			console.error("removeCustomServiceForUser - ERROR", res);
			showMessage(JSON.stringify(res, null, 2));
			if (errorCallback) errorCallback(res);
		}else{
			//Success
			showMessage(JSON.stringify(res, null, 2));
			if (successCallback) successCallback(res);
		}
	}, function(err){
		//Fail
		showMessage(JSON.stringify(err, null, 2));
		if (errorCallback) errorCallback(err);
	});
}