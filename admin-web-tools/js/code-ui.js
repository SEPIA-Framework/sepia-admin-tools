var codeEditor;
var extensionType;
var extensionDataArray = {};

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

	//Fill id/pwd/server form
	codeUiUpdateFormData();
}

//Get submit URL
function codeUiBuildSubmitURL(){
	codeUiUpdateFormData();
	var server;
	var serverType = "";
	var endpoint = "";
	if (extensionType == "smart-service"){
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
	codeEditor.save();
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

function loadSmartServicesListFromServer(){
	var link = "https://raw.githubusercontent.com/SEPIA-Framework/sepia-extensions/dev/smart-services/smart-services.json";
	genericGetRequest(link, function(data){
		showMessage(JSON.stringify(data, null, 2));
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

function codeUiExtensionTypeChange(){
	extensionType = $('#code-ui-extension-type').val();
	$('#code-ui-upload-btn').fadeIn(300);
	console.log("Extension typ is: " + extensionType);
}

function codeUiUpdateExtension(){
	//ClassName
	var name = $('#code-ui-extension-name').val();
	//Code
	if (extensionDataArray && Object.keys(extensionDataArray).length > 0){
		codeEditor.setValue(extensionDataArray[name].code || "");
	}
	$('#code-ui-source-class-name').val(name);
	console.log("Extension loaded: " + name);
}

function codeUiBuildExtensionNameOptions(dataArray){
	var html = '';
	$.each(dataArray, function(i, opt){
		html += ('<option value="' + opt.name + '">' + opt.name + '</option>');
	});
	$('#code-ui-extension-name').html(html);
}

function codeUiOpenSourceFile(event){
	if (event && event.target){
		var input = event.target;
		var reader = new FileReader();
		var fileName = document.getElementById('code-ui-file-input').files[0].name;
		reader.onload = function(){
			extensionDataArray = {};
			var name = fileName.replace(/\..*?$/, "").trim();
			extensionDataArray[name] = {
				"name" : name,
				"code" : reader.result,
				"url" : ""
			};
			codeUiBuildExtensionNameOptions(extensionDataArray);
			codeUiUpdateExtension();
			console.log(reader.result.substring(0, 200));
		};
		reader.readAsText(input.files[0]);
	}
}