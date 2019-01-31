//required: sjcl, jQuery, ByteMind.ui, ByteMind(core)

//WEBSERVICE connectors
function bytemind_build_webservice(){
	var Webservice = {};
	
	Webservice.apiURL = "http://localhost:8002";
	
	//ping server
	Webservice.ping = function(successCallback, failCallback, failOfflineCallback){
		ByteMind.ui.showLoader();
		$.ajax({
			url: (Webservice.apiURL + "/ping"),
			timeout: 3000,
			dataType: "jsonp",
			success: function(data) {
				ByteMind.ui.hideLoader();
				if (data.result && data.result === "fail"){
					if (failCallback) failCallback(data);
				}else{
					serverName = data.serverName;
					if (successCallback) successCallback(data);
				}
			},
			error: function(data) {
				if (!failOfflineCallback){
					failOfflineCallback = ByteMind.ui.showPopup(ByteMind.local.g('noConnectionToNetwork'), {
						buttonTwoName : ByteMind.local.g('tryAgain'),
						buttonTwoAction : function(){
							Webservice.ping(successCallback, failCallback);
						}
					});
				}
				Webservice.checkNetwork(failCallback, failOfflineCallback);
			}
		});
	}
	//check network
	Webservice.checkNetwork = function(successCallback, failCallback){
		ByteMind.ui.showLoader(true);
		$.ajax({
			url: ("https://api.github.com"),
			timeout: 1500,
			method: "HEAD",
			success: function(data) {
				ByteMind.ui.hideLoader();
				if (successCallback) successCallback(data);
			},
			error: function(data) {
				ByteMind.ui.hideLoader();
				if (failCallback) failCallback(data);
			}
		});
	}
	
	return Webservice;
}
