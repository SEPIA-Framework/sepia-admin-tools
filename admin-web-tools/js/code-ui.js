var javaEditor;

//Setup CodeMirror
function codeUiOnReady(){
	//Initialize editor
	var codeContainer = document.getElementById('code-ui-code-box-container');
	javaEditor = CodeMirror.fromTextArea(document.getElementById("code-ui-code-box"), {
		lineNumbers: true,
		matchBrackets: true,
		mode: "text/x-java",
		theme: "sepia-fw",
		dragDrop: true,
		allowDropFileTypes: ["text/x-java"]
	});
	javaEditor.setSize(codeContainer.offsetWidth, codeContainer.offsetHeight);
	javaEditor.setValue(document.getElementById('code-ui-source-code').value || document.getElementById('source-code').value);
	
	//Auto-resize editor
	window.addEventListener('resize', function(){
		javaEditor.setSize(codeContainer.offsetWidth, codeContainer.offsetHeight);
	});

	//Fill id/pwd/server form
	codeUiUpdateFormData();
}

//Get submit URL
function codeUiBuildSubmitURL(){
	codeUiUpdateFormData();
	var server = document.getElementById("server").value;
	var uploadform = document.getElementById('code-ui-upload-form');
	uploadform.action = server + 'upload-service' ;
	javaEditor.save();
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