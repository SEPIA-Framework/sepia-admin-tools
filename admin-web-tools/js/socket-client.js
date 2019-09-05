//Create channel on webSocket server
function createMessengerChannel(){
	var membersString = $('#msg-channel-members').val().trim();
	var membersArray = [];
	if (membersString){
		membersArray = membersString.split(/\s*,\s*/);
	}
	var data = {
		channelName: $('#msg-channel-name').val(),
		members: membersArray,
		isPublic: $('#msg-channel-public').is(':checked'),
		addAssistant: $('#msg-channel-assist').is(':checked')
	}
	//call
	genericPostRequest("chat", "createChannel", data,
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		}
	);

	//console.log(JSON.stringify(data));
	return false;
}

//Check statistics of channels
function checkChannelHistoryStats(){
	//call
	genericPostRequest("chat", "getChannelHistoryStatistic", {},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		}
	);
}

//Ask server to clean up outdated channel histories
function removeOutdatedChannelMessages(){
	//call
	genericPostRequest("chat", "removeOutdatedChannelMessages", {},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
		}
	);
}