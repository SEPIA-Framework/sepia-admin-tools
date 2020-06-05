function getUserEmailToCreate(){
	return $('#new-user-email').val();
}
function getUserToEdit(){
	return $('#edit-user-id').val();
}

//Create user from scratch
function createUser(){
	var email = getUserEmailToCreate();
	var pwd = $('#new-user-pwd').val();
	if (!email || !pwd){
		alert('You have to enter a new user email-address and desired password first!');
		return;
	}
	var reqBody = {
		service: "users",
		action: "create",
		data: {
			email: email,
			pwd: pwd
		}
	}
	userServicesPostRequest(reqBody, function(data){
		showMessage(JSON.stringify(data, null, 2));
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

//Put user on registration white-list
var whitelistedInSession = [];		//track users that have been white-listed during this session
function whitelistEmail(){
	var email = getUserEmailToCreate();
	if (!email){
		alert('You have to enter a new user email-address first!');
		return;
	}
	if ($.inArray(email, whitelistedInSession) > -1){
		alert('User has already been white-listed a few minutes ago!');
		return;
	}
	var reqBody = {
		service: "whitelist",
		action: "addUser",
		email: email
	}
	userServicesPostRequest(reqBody, function(data){
		whitelistedInSession.push(email);
		showMessage(JSON.stringify(data, null, 2));
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

//Get all users
function getUserList(from, size, keys){
	if (from == undefined) from = 0;
	if (size == undefined) size = 50;
	if (!keys || !keys.length) keys = ["Guuid", "Email"]; //["Guuid", "Email", "uroles", "statistics"];
	var reqBody = {
		service: "users",
		action: "list",
		data: {
			keys: keys,
			from: from,
			size: size
		}
	}
	userServicesPostRequest(reqBody, function(data){
		if (data.N && data.N >= size){
			showMessage(JSON.stringify(data, null, 2) 
				+ "\n\n---END---\n\n" 
				+ "NOTE: There might be more results! Run manually: getUserList(" + (from + size) + ", 50);"
			);
		}else{
			showMessage(JSON.stringify(data, null, 2));
		}
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

//Edit user-roles
function getUserRoles(){
	var userId = getUserToEdit();
	if (!userId){
		alert('Please enter a user ID to check first!');
		return;
	}
	var reqBody = {
		service: "roles",
		action: "getRoles",
		data: {
			userId: userId
		}
	}
	userServicesPostRequest(reqBody, function(data){
		showMessage(JSON.stringify(data, null, 2));
		$('#new-user-roles').val(data.roles);
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}
function setUserRoles(){
	var rolesString = $('#new-user-roles').val();
	var userId = getUserToEdit();
	if (!userId || !rolesString){
		alert('Please enter a user ID to edit and roles to set first!');
		return;
	}
	var roles = rolesString.replace(/\[|\]|\s+|"|'/gi, "").split(",");
	//console.log(roles);
	var reqBody = {
		service: "roles",
		action: "setRoles",
		data: {
			userId: userId,
			roles: roles
		}
	}
	userServicesPostRequest(reqBody, function(data){
		showMessage(JSON.stringify(data, null, 2));
	}, function(data){
		showMessage(JSON.stringify(data, null, 2));
	});
}

function deleteUser(){
	var userIdToDelete = getUserToEdit();
	if (!userIdToDelete){
		alert('Please enter a user ID first. As system admin you can delete ANY user BUT the core admin and assistant. As "normal" user you can ONLY delete yourself!');
		return;
	}else{
		if (userid == userIdToDelete){
			//authentication endpoint
			var r = confirm("Do you really want to delete your account?! WARNING: This cannot be undone unless you have a database backup!");
			if (r == true){
				var reqBody = {
					action: "deleteUser"
				}
				genericPostRequest("assist", "authentication", reqBody, 
					function(data){
						showMessage(JSON.stringify(data, null, 2));
					}, function(data){
						showMessage(JSON.stringify(data, null, 2));
					}
				);
			}
		}else{
			//user-management endpoint
			var r = confirm("Do you really want to delete the user with ID '" + userIdToDelete + "' ?! WARNING: This cannot be undone unless you have a database backup!");
			if (r == true){
				var reqBody = {
					service: "users",
					action: "delete",
					data: {
						userId: userIdToDelete
					}
				}
				userServicesPostRequest(reqBody, function(data){
					showMessage(JSON.stringify(data, null, 2));
				}, function(data){
					showMessage(JSON.stringify(data, null, 2));
				});
			}
		}		
	}
}

//------------

function userServicesPostRequest(data, successCallback, errorCallback){
	genericPostRequest("assist", "user-management", data, successCallback, errorCallback);
}