ByteMind.local = bytemind_build_strings();

function bytemind_build_strings(){
	var StringsDE = {};
	var StringsEN = {};
	
	//TODO: this is a crappy way of doing localizations, but for now it does its job
	
	//GERMAN
	StringsDE.welcome = 'Willkommen';
	StringsDE.help = 'Hilfe';
	StringsDE.username = 'Username';
	StringsDE.nickname = 'Spitzname';
	StringsDE.password = 'Passwort';
	StringsDE.language = 'Sprache';
	StringsDE.general = 'Allgemein';
	StringsDE.sendLogin = 'Login';
	StringsDE.sign_out = 'Abmelden';
	StringsDE.account = 'Account';
	StringsDE.addresses = 'Adressen';
	StringsDE.logout = 'Logout';
	StringsDE.closeLogin = 'Weiter ohne Login';
	//StringsDE.chatInputPlaceholder = 'Deine Nachricht ...';
	StringsDE.chatInputPlaceholder = '';
	StringsDE.loginFailedPlain = 'Login fehlgeschlagen!';
	StringsDE.loginFailedServer = 'Login fehlgeschlagen! - Das Problem könnte der Server sein.';
	StringsDE.loginFailedUser = 'Login fehlgeschlagen! - Username oder Password ist falsch.';
	StringsDE.noConnectionToNetwork = 'Es tut mir leid, aber sieht so aus als wärest du offline :-(';
	StringsDE.noConnectionToServer = 'Es tut mir leid, aber ich konnte keine Verbindung zum Server herstellen :-(';
	StringsDE.noConnectionToAssistant = 'Dein Assistent macht gerade Kaffeepause, ist sicher gleich zurück! (hoffentlich)';
	StringsDE.noAsrSupport = 'Es tut mir leid, aber dieser Client unterstütz die Spracherkennung leider nicht :-(';
	StringsDE.asrSettingsProblem = 'Mikrofon nicht richtig erkannt oder Zugriff verweigert.';
	StringsDE.nobodyThere = 'Uups, es scheint zur Zeit leider keiner hier zu sein, der dir antworten könnte :-(';
	StringsDE.loading = 'Lädt';
	StringsDE.ok = 'Ok';
	StringsDE.done = 'Erledigt';
	StringsDE.back = 'Zurück';
	StringsDE.next = 'Weiter';
	StringsDE.save = 'Speichern';
	StringsDE.tryAgain = 'Nochmal versuchen';
	StringsDE.locateMe = 'Standort bestimmen';
	StringsDE.deviceId = 'Geräte ID';
	StringsDE.copyList = 'Diese Liste gehört einem anderen User, möchtest du sie in deinen Account kopieren?';
	StringsDE.deleteItemConfirm = 'Bist du sicher, dass du das löschen möchtest?';
	StringsDE.deleteItem = 'Löschen';
	StringsDE.hideItem = 'Verstecken';
	StringsDE.addItem = 'Item hinzufügen';
	StringsDE.moveToMyView = '← MyView';
	StringsDE.alarm = 'Wecker';
	StringsDE.alarmClock = 'Wecker'; 		//name is title of UserDataList
	StringsDE.timer = 'Timer';				//name is title of UserDataList
	StringsDE.oclock = 'Uhr';
	StringsDE.expired = 'abgelaufen';
	StringsDE.clearHistory = 'Verlauf löschen';
	StringsDE.refreshUI = 'Interface neu laden';
	StringsDE.refreshUI_info = 'Um Änderungen, die hier gemacht wurden zu <u>sehen</u> muss das Interface neu geladen werden';
	StringsDE.recommendationsFor = 'Empfehlungen für';
	StringsDE.adrHome = 'Zu Hause';
	StringsDE.adrWork = 'Arbeit';
	StringsDE.street = 'Straße';
	StringsDE.street_nbr = 'Nr.';
	StringsDE.city = 'Stadt';
	StringsDE.zip_code = 'PLZ';
	StringsDE.country = 'Land';
	StringsDE.license = 'Lizenz';
	StringsDE.data_privacy = 'Datenschutz';
	
	//ENGLISH
	StringsEN.welcome = 'Welcome';
	StringsEN.help = 'Help';
	StringsEN.username = 'Username';
	StringsEN.nickname = 'Nickname';
	StringsEN.password = 'Password';
	StringsEN.language = 'Language';
	StringsEN.general = 'General';
	StringsEN.sendLogin = 'Login';
	StringsEN.sign_out = 'Sign out';
	StringsEN.account = 'Account';
	StringsEN.addresses = 'Addresses';
	StringsEN.logout = 'Logout';
	StringsEN.closeLogin = 'Continue without login';
	//StringsEN.chatInputPlaceholder = 'Your message ...';
	StringsEN.chatInputPlaceholder = '';
	StringsEN.loginFailedPlain = 'Login failed!';
	StringsEN.loginFailedServer = 'Login failed! - Problem could be the server.';
	StringsEN.loginFailedUser = 'Login failed! - Wrong username or password.';
	StringsEN.noConnectionToNetwork = 'I\'m sorry but it seems that you are offline :-(';
	StringsEN.noConnectionToServer = 'I\'m sorry but I could not establish a connection to the server :-(';
	StringsEN.noConnectionToAssistant = 'Your assistant is taking a coffee break, will be right back! (hopefully)';
	StringsEN.noAsrSupport = 'I\'m sorry but this client does not support speech recognition :-(';
	StringsEN.asrSettingsProblem = 'Microphone has not been recognized properly or access was denied.';
	StringsEN.nobodyThere = 'Uups, sorry but it seems there is nobody here to answer your message :-(';
	StringsEN.loading = 'Loading';
	StringsEN.ok = 'Ok';
	StringsEN.done = 'Erledigt';
	StringsEN.back = 'Back';
	StringsEN.next = 'Next';
	StringsEN.save = 'Save';
	StringsEN.tryAgain = 'Try again';
	StringsEN.locateMe = 'Refresh my location';
	StringsEN.deviceId = 'Device ID';
	StringsEN.copyList = 'This list belongs to another user, do you want to copy it to your account?';
	StringsEN.deleteItemConfirm = 'Are you sure you want to delete this?';
	StringsEN.deleteItem = 'Delete';
	StringsEN.hideItem = 'Hide';
	StringsEN.addItem = 'Add item';
	StringsEN.moveToMyView = '← MyView';
	StringsEN.alarm = 'Alarm';
	StringsEN.alarmClock = 'Alarm';		//name is title of UserDataList
	StringsEN.timer = 'Timer';			//name is title of UserDataList
	StringsEN.oclock = 'o\'clock';
	StringsEN.expired = 'expired';
	StringsEN.clearHistory = 'Clear history';
	StringsEN.refreshUI = 'Refresh interface';
	StringsEN.refreshUI_info = 'To <u>see</u> changes you made here you need to refresh the interface';
	StringsEN.recommendationsFor = 'Recommendations for';
	StringsEN.adrHome = 'Home';
	StringsEN.adrWork = 'Work';
	StringsEN.street = 'Street';
	StringsEN.street_nbr = 'Nbr.';
	StringsEN.city = 'City';
	StringsEN.zip_code = 'Zip';
	StringsEN.country = 'Country';
	StringsEN.license = 'License';
	StringsEN.data_privacy = 'Data Privacy';
	
	var StringsLocale = {};
	if (ByteMind.config.language.toLowerCase() === "de"){
		StringsLocale = StringsDE;
	}else{
		StringsLocale = StringsEN;
	}
	
	//get string
	StringsLocale.g = function(name){
		return StringsLocale[name];
	}
	
	//write string
	StringsLocale.w = function(name){
		document.write(StringsLocale[name]);
	}

	//translate all
	StringsLocale.translateAll = function(){
		$('[data-bm-local-text]').each(function(){
			$(this).html(StringsLocale.g(this.dataset.bmLocalText));
		});
		$('[data-bm-local-value]').each(function(){
			$(this).val(StringsLocale.g(this.dataset.bmLocalText));
		});
		$('[data-bm-local-placeholder]').each(function(){
			$(this).attr("placeholder", StringsLocale.g(this.dataset.bmLocalPlaceholder));
		});
	}
	
	return StringsLocale;
}