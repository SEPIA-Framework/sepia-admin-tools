function getSentences(lang){
	if (lang === "de"){
		return sentencesDE;
	}else{
		return sentencesEN;
	}
}
var sentencesDE = [
	"Hallo",
	"Wie gehts?",
	"Test",
	"Kannst du mich hören?",
	"Mork Mork",
	"Zeig mir die technik News"
];
var sentencesEN = [
	"Hello",
	"How are you?",
	"Test",
	"Can you hear me?",
	"Mork Mork",
	"Show me tech news"
];

//get language of test input
function getAssistantLanguage(){
	//var langSel = document.getElementById('assist-language-select');
	//var langVal = langSel.options[langSel.selectedIndex].value;
	return $('#assist-language-select').val();
}

//some missing data
var testLocation = JSON.stringify({	latitude: "52.52",	longitude: "13.37", city: "Berlin" });

//test interpreter
function interpret(text, successCallback, errorCallback){
	if (!text){
		text = $('#test-sentence').val();
	}
	var body = {
		"text" : text,
		"lang" : getAssistantLanguage(),
		"time" : new Date().getTime(),
		"time_local" : getLocalDateTime(),
		"user_location" : testLocation
	}
	if (successCallback){
		genericFormPostRequest("assist", "interpret", body, successCallback, errorCallback);
	}else{
		genericFormPostRequest("assist", "interpret", body, function(data){
			showMessage(JSON.stringify(data, null, 2));
		}, function(data){
			showMessage(JSON.stringify(data, null, 2));
		});
	}
}

//test answer
function answer(text, successCallback, errorCallback){
	if (!text){
		text = $('#test-sentence').val();
	}
	var body = {
		"text" : text,
		"lang" : getAssistantLanguage(),
		"time" : new Date().getTime(),
		"time_local" : getLocalDateTime(),
		"user_location" : testLocation
	}
	if (successCallback){
		genericFormPostRequest("assist", "answer", body, successCallback, errorCallback);
	}else{
		genericFormPostRequest("assist", "answer", body, function(data){
			showMessage(JSON.stringify(data, null, 2));
		}, function(data){
			showMessage(JSON.stringify(data, null, 2));
		});
	}
}

//report wrong answer/command
function reportSentence(){
	alert('Under construction');
}

//---------------------------

//remote-action types available
function buildRemoteActionTypeSelectorOptions(){
	var html = '' 
		+ '<option value="" selected disabled>-Select-</option>'
		+ '<option value="hotkey">Hotkey</option>'
		;
	return html;
}
function onRemoteActionTypeChange(){
	var type = $('#remote-action-type-sel').val();
	if (type == 'hotkey'){
		$('#remote-action').attr('placeholder', '{"key":"F4", "language":"de"}');
	}else{
		$('#remote-action').attr('placeholder', 'Action');
	}
}
//get type of remote action from select
function getRemoteActionType(){
	return $('#remote-action-type-sel').val();
}
//get action data of remote action
function getRemoteActionData(actionType){
	var str = $('#remote-action').val();
	if (actionType && str){
		str = str.trim();
		//modify if not object
		if (actionType == "hotkey"){
			if (str.indexOf("{") != 0){
				str = '{"key":"' + str + '"}';
			}
		}
		return str;
	}else{
		return str;
	}
}

//send remote-action
function sendRemoteAction(){
	var actionType = getRemoteActionType();
	var actionData = getRemoteActionData(actionType);
	var targetChannelId = $('#remote-action-channel-id').val();
	var targetDeviceId = $('#remote-action-device-id').val();
	var body = {
		type: actionType,
		action: actionData
	}
	if (targetChannelId) body.targetChannelId = targetChannelId;
	if (targetDeviceId) body.targetDeviceId = targetDeviceId;
	console.log('RemoteAction: ' + JSON.stringify(body));
	
	genericFormPostRequest("assist", "remote-action", body, function(data){
		showMessage(JSON.stringify(data, null, 2));
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

//---- PERFORMANCE TESTS ----

//test answer performance
function testAnswerPerformance(){
	var sentences = getSentences(getAssistantLanguage());
	var N = parseInt(test_N.value);
	var errorsN = 0;
	var sync = synch_select.options[synch_select.selectedIndex].value;
	var results = [];
	var errors = [];
	var callFun;
	if (sync != "sync"){
		callFun = callFunAsync;
		console.log("testing asynchronous");
	}else{
		callFun = callFunSync;
		console.log("testing synchronous");
	}
	var i = 0;
	callFun(function(callback){
		var tic = new Date().getTime();
		var j = ++i;
		var sentence = "";
		if (j > sentences.length){
			var newJ = (j % sentences.length);
			if (newJ == 0) newJ = sentences.length;
			sentence = sentences[newJ-1];
		}else{
			sentence = sentences[j-1];
		}
		console.log(j + " - Q: " + sentence + " - " + tic);
		answer(sentence, function(data){
			var toc = new Date().getTime();
			console.log(j + " - A: " + data.answer + " - " + tic);
			results.push(toc-tic);
			callback();
		}, function(data){
			var toc = new Date().getTime();
			console.log(j + " - error - " + tic);
			errors.push(toc-tic);
			errorsN++;
			callback();
		});
	}, N, 0, function(){
		console.log("done");
		console.log(results);
		console.log(errors);
		var sum = results.reduce(function(a, b) { return a + b; });
		var avg = sum / results.length;
		var msg = "DONE" 
			+ "<br>Result times (ms): " + results 
			+ "<br>Error times (ms): " + errors
			+ "<br>Average (ms): " + avg
			+ "<br>Minimum (ms): " + Math.min(...results)
			+ "<br>Maximum (ms): " + Math.max(...results);
		showMessage(msg);
	});
}