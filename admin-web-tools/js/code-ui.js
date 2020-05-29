var codeEditor;
var extensionType;
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
	var uploadform = document.getElementById('code-ui-upload-form');
	uploadform.action = (server + endpoint);
	return true;
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
			html += ('<option value="' + opt.name + '">' + opt.name + '</option>');
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
