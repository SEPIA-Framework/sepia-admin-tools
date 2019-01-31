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
		+ '<option value="hotkey">Hotkey</option>';
	return html;
}
//get type of remote action from select
function getRemoteActionType(){
	return $('#remote-action-type-sel').val();
}

//send remote-action
function sendRemoteAction(){
	var data = {
		type: getRemoteActionType()
	}
	console.log('RemoteAction: ' + JSON.stringify(data));
	alert('Under construction');
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