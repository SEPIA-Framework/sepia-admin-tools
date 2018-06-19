//Create channel on webSocket server
function createMessengerChannel(){
	var membersString = $('#msg-channel-members').val().trim();
	var membersArray;
	if (membersString){
		membersArray = membersString.split(/,\s+/);
	}
	var data = {
		channelId: $('#msg-channel-id').val(),
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