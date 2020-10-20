//Create channel on webSocket server
function ttsSpeak(){
	var ttsData = {
		text: $('#tts-text').val(),
		lang: $('#tts-language').val(),
		voice: $('#tts-voice').val(),
		gender: $('#tts-gender').val(),
		mood: $('#tts-mood').val()
	}
	//call
	genericFormPostRequest("assist", "tts", ttsData,
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			if (data.url){
				var fullUrl = getServer('assist').replace(/\/$/, "") + data.url;
				$('#tts-audio-player')[0].src = fullUrl;
				$('#tts-audio-player')[0].load();
			}
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		}
	);
	//console.log(JSON.stringify(data));
}

//Check statistics of channels
function ttsGetInfo(){
	//call
	genericFormPostRequest("assist", "tts-info", {},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			//add to options
			$('#tts-voice').html("");
			if (data.voices){
				var opt = document.createElement('option');
				opt.value = ""; opt.textContent = "- automatic -";
				$('#tts-voice').append(opt);
				var isFirst = false;
				data.voices.forEach(function(v){
					var opt = document.createElement('option');
					opt.value = v;	opt.textContent = v;
					if (!isFirst){ 
						isFirst = true; opt.selected = true;
					}
					$('#tts-voice').append(opt);
				});
			}
			$('#tts-language').html("");
			if (data.languages){
				var opt = document.createElement('option');
				opt.value = ""; opt.textContent = "- automatic -";
				$('#tts-language').append(opt);
				data.languages.forEach(function(l){
					var opt = document.createElement('option');
					opt.value = l;	opt.textContent = l;
					$('#tts-language').append(opt);
				});
			}
			$('#tts-gender').html("");
			if (data.genders){
				var opt = document.createElement('option');
				opt.value = ""; opt.textContent = "- automatic -";
				$('#tts-gender').append(opt);
				data.genders.forEach(function(g){
					var opt = document.createElement('option');
					opt.value = g;	opt.textContent = g;
					$('#tts-gender').append(opt);
				});
			}
			$('#tts-mood').html("");
			/* if (data.maxMoodIndex != undefined){ ... } */
			for (var i=0; i<11; i++){
				var opt = document.createElement('option');
				opt.value = i;
				opt.textContent = "" + i + "";
				if (i == 5) opt.selected = true;
				$('#tts-mood').append(opt);
			}
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		}
	);
}

function ttsPlayer(action){
	var player = document.getElementById('tts-audio-player');
	if (action == "play"){
		player.play();
	}else if (action == "pause"){
		player.pause();
	}else if (action == "vol-up"){
		player.volume = ((player.volume < 0.9)? (player.volume + 0.1) : 1.0);
	}else if (action == "vol-down"){
		player.volume = ((player.volume > 0.1)? (player.volume - 0.1) : 0.0);
	}
}
