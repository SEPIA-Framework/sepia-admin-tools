//Save new answer to DB that can be used in services
function saveAnswer(){
	var data = {};
	
	data['language'] = $('select[name=answer-language]').val();
	
	data['type'] = $('input[name=answer-type]').val();
	data['text'] = $('input[name=answer-text]').val();
	
	data['repetition'] = $('input[name=answer-repetition').val();
	
	data['mood'] = $('input[name=answer-mood]').val();
	
	data['public'] = $('input[name=answer-public]').is(':checked');
	data['local'] = $('input[name=answer-local]').is(':checked');
	data['explicit'] = $('input[name=answer-explicit]').is(':checked');
	
	data['polite'] = $('input[name=answer-polite]').is(':checked');
	data['cool'] = $('input[name=answer-cool]').is(':checked');
	data['rude'] = $('input[name=answer-rude]').is(':checked');
	data['neutral'] = $('input[name=answer-neutral]').is(':checked');
	
	data['tags'] = $('input[name=answer-tags]').val();
	data['systemdefault'] = $('input[name=answer-systemdefault]').is(':checked');
	
	$('input[name=answer-id]').val("");
	
	//call
	genericFormPostRequest("teach", "addAnswer", data, function(res){
		showMessage(JSON.stringify(res, null, 2));
	}, function(res){
		showMessage(JSON.stringify(res, null, 2));
	});
	
	//console.log(JSON.stringify(data));
	return false;
}

//Load answer from DB
var answersEntriesCache = [];

function loadAnswer(){
	answersEntriesCache = [];
	$('input[name=answer-id]').val("");
	
	var data = {};
	data['language'] = $('select[name=answer-language]').val();
	data['type'] = $('input[name=answer-type]').val();
	/*
	data['repetition'] = $('input[name=answer-repetition').val();
	data['mood'] = $('input[name=answer-mood]').val();
	data['polite'] = $('input[name=answer-polite]').is(':checked');
	data['cool'] = $('input[name=answer-cool]').is(':checked');
	data['rude'] = $('input[name=answer-rude]').is(':checked');
	data['neutral'] = $('input[name=answer-neutral]').is(':checked');
	*/
	
	//call
	if (data.language && data.type){
		genericFormPostRequest("teach", "getAnswersByType", data, function(res){
			if (res.entries && res.entries.length > 0){
				answersEntriesCache = res.entries;
				showMessage(buildEntries(res), true);
			}else{
				showMessage(JSON.stringify(res, null, 2));
			}
		}, function(res){
			showMessage(JSON.stringify(res, null, 2));
		});
	}else{
		alert("Please select at least 'language' and 'type'.");
	}
	
	//console.log(JSON.stringify(data));
	return false;
}

//Modify answer
function modifyAnswer(){
	var id = $('#answers-results').val();
	if (id){
		alert('Under construction - Modify id: ' + id);
	}
}

//Delete answer
function deleteAnswer(){
	var id = $('#answers-results').val();
	if (!id){
		alert('Operation requires ID field! Use load before.');
	}else{
		var data = {
			id: id
		}
		genericFormPostRequest("teach", "deleteAnswerById", data, function(res){
			showMessage(JSON.stringify(res, null, 2));
		}, function(res){
			showMessage(JSON.stringify(res, null, 2));
		});
	}
}

//--------- Results display ----------

function buildEntries(data){
	var html = '<p>Found answers: </p>';
	html += '<select id="answers-results" onchange="answersEntriesSelected()">';
	html += '<option value="" selected="true" disabled="disabled">' + "-- select answer --" + '</option>';
	$.each(data.entries, function(index, entry){
		var source = entry._source;
		var info = "rep:" + source.repetition + "; mood:" + source.mood + "; - " + source.text + " (" + source.characters + ")";
		html += '<option value="' + entry._id + '">' + info + '</option>';
	});
	html += '</select><br>';
	html += '<button id="answers-results-load-btn" class="interface_button" onclick="loadAnswerDetails()">DETAILS</button>';
	html += '<button id="answers-results-delete-btn" class="interface_button" onclick="deleteAnswer()">DELETE</button><br>';
	html += '<br><div id="answers-results-details"></div>';
	return html;
}

function answersEntriesSelected(){
	var id = $('#answers-results').val();
	$('input[name=answer-id]').val(id);
	$('#answers-results-details').html("");
}

function loadAnswerDetails(){
	var id = $('#answers-results').val();
	$('input[name=answer-id]').val(id);
	$.each(answersEntriesCache, function(index, entry){
		if (id == entry._id){
			var source = entry._source;
			var rep = source.repetition;
			var mood = source.mood;
			var text = source.text;
			var chars = source.characters;
			$('#answers-results-details').html(escapeHtml(JSON.stringify(entry, null, 2)));
		}
	});
}

//TODO: make nice HTML list for load