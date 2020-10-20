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

//Delete user
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

//Edit user-roles:

var availableUserRoles = [
	{value: "user"},
	{value: "smarthomeguest"},
	{value: "smarthomeadmin"},
	{value: "developer"},
	{value: "tinkerer"},
	{value: "tester"},
	{value: "seniordev"},
	{value: "chiefdev"},
	{value: "inviter"},
	{value: "infant"},
	{value: "kid"},
	{value: "teen"},
	{value: "elderly"},
	{value: "thing"}
];
var protectedCoreUserRoles = {
	"assistant": true,
	"superuser": true
}

function getUserRoles(successCallback, errorCallback){
	var userId = getUserToEdit();
	if (!userId){
		alert("Please enter the ID of the user you want to edit into the field 'UserID' first!");
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
		if (successCallback){
			successCallback(data);
		}else{
			showMessage(JSON.stringify(data, null, 2));
			$('#new-user-roles').val(data.roles);
		}
	}, function(data){
		if (errorCallback){
			errorCallback(data);
		}else{
			showMessage(JSON.stringify(data, null, 2));
		}
	});
}
function setUserRoles(newRolesString, successCallback, errorCallback){
	var rolesString = newRolesString || $('#new-user-roles').val();
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
		if (successCallback){
			successCallback(data);
		}else{
			showMessage(JSON.stringify(data, null, 2));
		}
	}, function(data){
		if (errorCallback){
			errorCallback(data);
		}else{
			showMessage(JSON.stringify(data, null, 2));
		}
	});
}
function manageUserRoles(){
	var userId = getUserToEdit();
	if (!userId){
		alert("Please enter the ID of the user you want to edit into the field 'UserID' first!");
		$('#edit-user-id').focus();
		return;
	}
	//get existing roles
	getUserRoles(function(data){
		//success - build editor
		var config = {
			useSmallCloseButton: true,
			requireSelection: true
		}
		var rolesEditor = document.createElement("div");
		rolesEditor.innerHTML = "<div class='user-roles-editor'>" + 
				"<h3>User Roles Editor</h3>" +
				"<div style='display: flex; flex-direction: column;'>" + 
					"<p>Add New Role:</p>" + 
					"<div class='user-roles-item'>" + 
						"<select class='user-roles-editor-add-selector'>" + buildUserRolesOptions() + "</select>" + 
						"<button class='user-roles-editor-add-btn'><i class='material-icons md-txt'>add</i></button>" +
					"</div>" + 
					"<p>Existing User Roles:</p>" + 
					"<div class='user-roles-editor-existing-roles' style='display: flex; flex-direction: column;'>" + 
						//dynamically generated
					"</div>" +
					"<div style='margin-top: 16px;'>" + 
						"<button class='user-roles-editor-btn-save' style='background: #44c8be; display: none;'>SAVE</button>" + 
						"<button class='user-roles-editor-btn-cancel'>CANCEL</button>" + 
					"</div>" +
				"</div>" +
			"</div>";
		ByteMind.ui.showPopup(rolesEditor, config);
		var $re = $(rolesEditor);
		var $existingRolesBox = $re.find('.user-roles-editor-existing-roles');
		var $userRoleSelector = $re.find('.user-roles-editor-add-selector');
		var $saveBtn = $re.find('.user-roles-editor-btn-save');
		var $cancelBtn = $re.find('.user-roles-editor-btn-cancel');
		//item builder
		function buildItem(role){
			var item = document.createElement("div");
			item.className = "user-roles-item";
			var name = document.createElement("div");
			name.innerHTML = role;
			var delBtn =  document.createElement("button");
			delBtn.innerHTML = "<i class='material-icons md-txt'>delete</i>";
			//delete
			$(delBtn).on('click', function(){
				$(item).remove();
				if ($existingRolesBox.children().length == 0){
					$existingRolesBox.html("- No roles yet -");
				}
				$saveBtn.show(300);
			});
			item.appendChild(name);
			item.appendChild(delBtn);
			$existingRolesBox.append(item);
		}
		//add button
		var $addButton = $re.find('.user-roles-editor-add-btn');
		$addButton.on('click', function(){
			var newRole = $userRoleSelector.val();
			if (newRole){
				var $children = $existingRolesBox.children();
				var roleAlreadyExists = false;
				$children.each(function(index, itm){
					if (itm.firstElementChild.innerHTML == newRole){
						roleAlreadyExists = true;
					}
				});
				if (!roleAlreadyExists){
					if ($children.length == 0){
						$existingRolesBox.html("");		//remove text note
					}
					buildItem(newRole);
					$saveBtn.show(300);
				}
			}
		});
		//build role items
		var rolesArray = data.roles;
		var userHasProtectedCoreRoles = false;
		if (rolesArray && rolesArray.length > 0){
			rolesArray.forEach(function(r){
				if (protectedCoreUserRoles[r]){
					userHasProtectedCoreRoles = true;
				}
				buildItem(r);
			});
		}else{
			$existingRolesBox.html("- No roles found -");
		}
		//save button
		$saveBtn.on('click', function(){
			var rolesString = "";
			var $children = $existingRolesBox.children();
			$children.each(function(index, itm){
				rolesString = rolesString + itm.firstElementChild.innerHTML + ", ";
			});
			rolesString = rolesString.replace(/, $/, "");
			if (rolesString){
				setUserRoles(rolesString, function(res){
					$saveBtn.hide(300);
					$cancelBtn.html("DONE");
					showMessage(JSON.stringify(res, null, 2));
				}, function(err){
					ByteMind.ui.hidePopup();
					showMessage(JSON.stringify(err, null, 2));
				});
			}
		});
		//cancel button
		$re.find('.user-roles-editor-btn-cancel').on('click', function(){
			ByteMind.ui.hidePopup();
		});
		//notify that this user is protected and abort?
		if (userHasProtectedCoreRoles){
			$saveBtn.remove();
			$re.find("p").remove();
			$userRoleSelector.parent().remove();
			$existingRolesBox.html("This user is protected and cannot be edited!");
			$cancelBtn.html("Understood");
		}
	});
}
function buildUserRolesOptions(selected){
	var options = {};
	if (availableUserRoles){
		availableUserRoles.forEach(function(ur){
			options[ur.value] = ur.name || ur.value;
		});
	}
	return buildOptionsSelector(options, selected, function(optionsObj){
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}, function(optionsObj){
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	});
}

//------------

function userServicesPostRequest(data, successCallback, errorCallback){
	genericPostRequest("assist", "user-management", data, successCallback, errorCallback);
}