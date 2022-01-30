//requirements: none?

var ByteMind = new Object();

//default library stuff
ByteMind.debug = bytemind_build_debug();
ByteMind.data = bytemind_build_dataService();
ByteMind.page = bytemind_build_page();
ByteMind.config = bytemind_build_config();

//more plugins
ByteMind.buildPlugins = function(){
	if (typeof bytemind_build_ui === "function"){ 			ByteMind.ui = bytemind_build_ui(); 						ByteMind.debug.info("Loading plugin: ByteMind.ui"); }
	if (typeof bytemind_build_webservice === "function"){	ByteMind.webservice = bytemind_build_webservice();		ByteMind.debug.info("Loading plugin: ByteMind.webservice"); }
	if (typeof bytemind_build_account === "function"){ 		ByteMind.account = bytemind_build_account();			ByteMind.debug.info("Loading plugin: ByteMind.account"); }
	if (typeof bytemind_build_ui_carousel === "function"){ 	ByteMind.ui.Carousel = bytemind_build_ui_carousel(); 	ByteMind.debug.info("Loading plugin: ByteMind.carousel"); }
	if (typeof bytemind_build_ui_sidemenu === "function"){ 	ByteMind.ui.SideMenu = bytemind_build_ui_sidemenu(); 	ByteMind.debug.info("Loading plugin: ByteMind.sidemenu"); }
}

//CONFIG
function bytemind_build_config(){
	var Config = {};
	
	Config.language = ByteMind.page.getURLParameter("lang") || navigator.language || navigator.userLanguage;
	if (Config.language && Config.language.toLowerCase().indexOf('de') === 0){
		Config.language = 'de';
	}else{
		Config.language = 'en';
	}
	
	Config.clientInfo = "website";
	
	//add everything here that needs to be refreshed after language change
	Config.broadcastLanguage = function(language){
		//TODO: make it a real broadcaster with listener function
		Config.language = language; 		//TODO: interface reload to set texts?
		//log and save
		ByteMind.data.updateAccount('language', language);
		ByteMind.debug.log('Config: broadcasted language=' + language);
	}
	//broadcast-event when userName (really the name not the id) is changed
	Config.broadcastUserName = function(userName){
		//TODO: make it a real broadcaster with listener function
		//log and save
		ByteMind.data.updateAccount('userName', userName);
		ByteMind.debug.log('Config: broadcasted userName=' + userName);
	}
	//broadcast logout event
	Config.broadcastLogout = function(){
		//TODO: make it a real broadcaster with listener function
		//close windows, listeners, delete data and stuff to clean up etc.
	}
		
	return Config;
}

//DEBUG
function bytemind_build_debug(){
	var Debug = {};
	
	Debug.doLog = true;
	Debug.doError = true;
	Debug.doInfo = true;
	
	//get default local date/timeout for debugger
	Debug.getLocalDateTime = function(){
		var d = new Date();
		var HH = addZero(d.getHours());
		var mm = addZero(d.getMinutes());
		var ss = addZero(d.getSeconds());
		var dd = addZero(d.getDate());
		var MM = addZero(d.getMonth() + 1);
		var yyyy = d.getFullYear();
		return '' + yyyy + '.' + MM + '.' + dd + '_' + HH + ':' + mm + ':' + ss;
	}
	function addZero(i) {
		return (i < 10)? "0" + i : i;
	}
	
	Debug.setLog = function(doLog){
		if (doLog){
			Debug.doLog = true;
			Debug.log = Function.prototype.bind.call(console.log, console, 'Bytemind - LOG -');
		}else{
			Debug.doLog = false;
			Debug.log = Function.prototype.bind.call(function(){}, console);
		}
	}
	Debug.setLog(Debug.doLog);
	
	Debug.setError = function(doError){
		if (doError){
			Debug.doError = true;
			Debug.err = Function.prototype.bind.call(console.error, console, 'Bytemind - ERROR -');
		}else{
			Debug.doError = false;
			Debug.err = Function.prototype.bind.call(function(){}, console);
		}
		Debug.error = Debug.err;
	}
	Debug.setError(Debug.doError);
	
	Debug.setInfo = function(doInfo){
		if (doInfo){
			Debug.doInfo = true;
			Debug.info = Function.prototype.bind.call(console.log, console, 'Bytemind - INFO -');
		}else{
			Debug.doInfo = false;
			Debug.info = Function.prototype.bind.call(function(){}, console);
		}
	}
	Debug.setInfo(Debug.doInfo);
	
	return Debug;
}

//DATA STORAGE
function bytemind_build_dataService(){
	var DataService = {};
	
	var data = load();

	function save(){
		try{
			localStorage.setItem('ByteMind-data', JSON.stringify(data));
		}catch (e){
			ByteMind.debug.err('Data: localStorage write error! Not available?');
		}
	}
	function load(){
		try{
			data = JSON.parse(localStorage.getItem('ByteMind-data')) || {};
		}catch (e){
			data = {};
		}
		return data;
	}
	DataService.get = function(key){
		load();
		return (data && (key in data)) ? data[key] : undefined;
	}
	DataService.set = function(key, value){
		data[key] = value;
		save();
	}
	DataService.updateAccount = function(key, value){
		var account = DataService.get('account');
		if (!account){
			account = {};
		}
		account[key] = value;
		account.lastRefresh = new Date().getTime();
		DataService.set('account', account);
	}
	DataService.del = function(key){
		load();
		delete data[key];
		save();
	}
	DataService.clearAll = function(){
		data = {};
		localStorage.removeItem('ByteMind-data');
	}
	
	return DataService;
}

//PAGE TOOLS - like URL actions and single page navigation
function bytemind_build_page(){
	var Page = {};
	
	var pageActions = {};
	
	var SECTION_PREFIX = "#!";		//note: changing this requires regEx rework
	var activeSection = "blank";
	
	Page.sideMenu;
	
	//register a page action
	Page.registerAction = function(name, data){
		pageActions[name] = data;
	}
	//activate page action by URL
	Page.checkUrlForAction = function(){
		var actionName = "";
		// if (window.location.pathname.search(/\/\w+/) === 0){
		//	actionName = window.location.pathname.substr(1).replace(/\?.*/,'').trim();	
		//}else 
		if (window.location.href.search(/(#!|&|\?)/) >= 0){
			//get hash-bang or the URL parameters action, a, page, p
			actionName = Page.getFirstURLParameter('(_escaped_fragment_|action|page|a|p)');
			if (!actionName && window.location.hash.search(/(#!)/) === 0){
				actionName = window.location.hash.substr(2).replace(/\?.*/,'').trim();
			}
		}
		if (actionName){
			var data = pageActions[actionName];
			if (data){
				Page.activateAction(data);
				return true;
			}
		}
		return false;
	}
	//activate page action with data
	Page.activateAction = function(data, options){
		if (data.callback) data.callback(data, options);
	}
	//activate page action by name
	Page.activateActionByName = function(actionName, options){
		var data = pageActions[actionName];
		if (data){
			Page.activateAction(data, options);
			return true;
		}
		return false;
	}
	
	//get URL parameters
	Page.getURLParameter = function(name){
		var urlPart = location.search || location.hash;
		return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(urlPart)||[,""])[1].replace(/\+/g, '%20'))||null
	}
	Page.getFirstURLParameter = function(namesRegex){
		var urlPart = location.search || location.hash;
		return decodeURIComponent((new RegExp('[?|&]' + namesRegex + '=' + '([^&;]+?)(&|#|;|$)').exec(urlPart)||[,"",""])[2].replace(/\+/g, '%20'))||null
	}
	
	//set or add a parameter of a given URL with encoding and return modified url
	Page.setParameterInURL = function(url, parameter, value){
		if ((url.indexOf('?' + parameter + '=') > -1) || (url.indexOf('&' + parameter + '=') > -1)){
			url = url.replace(new RegExp("(\\?|&)(" + parameter + "=.*?)(&|$)"), "$1" + parameter + "=" + encodeURIComponent(value) + "$3");
		}else{
			if (url.indexOf('?') > -1){
				url += '&' + parameter + "=" + encodeURIComponent(value);
			}else{
				url += '?' + parameter + "=" + encodeURIComponent(value);
			}
		}
		return url;
	}
	
	//PAGE NAVIGATION
	
	//register page section and add button to top-bar (default 'bytemind-top-bar' or 'bytemind-webapp-top-bar')
	Page.registerSectionWithNavButton = function(uiName, data, alternativeTarget){
		//add section-tag to view
		if (data.sectionName && data.view){
			$(data.view).attr('data-bm-section', data.sectionName);
		}else if (data.sectionName && data.viewId){
			$('#' + data.viewId).attr('data-bm-section', data.sectionName);
		}
		//add callback
		data.callback = Page.switchSection;
		//build button
		var btn = document.createElement('a');		//document.createElement('button');
		btn.className = 'bytemind-nav-bar-button bytemind-button';
		btn.innerHTML = uiName;
		btn.href = window.location.host + "/" + SECTION_PREFIX + data.sectionName;
		btn.draggable = false;
		ByteMind.ui.onclick(btn, function(event){
		//$(btn).on('click', function(event){
			event.preventDefault();
			var options = {
				animate : true
			}
			Page.switchSection(data, options);
		});
		$(btn).attr('data-bm-section-btn', data.sectionName);
		if (alternativeTarget){
			$(alternativeTarget).append(btn);
		}else{
			$('#bytemind-top-bar-dynamic, #bytemind-webapp-top-bar-dynamic, #bytemind-top-bar, #bytemind-webapp-top-bar').first().append(btn);
		}
		//register action
		Page.registerAction(data.sectionName, data);
	}
	
	//register a button that appears in the default menu (or chosen target)
	Page.registerMenuButton = function(uiName, data, alternativeTarget){
		//build button
		var btn = document.createElement('a');		//document.createElement('button');
		btn.className = 'bytemind-nav-bar-button bytemind-button';
		btn.innerHTML = uiName;
		if (data.href){
			btn.href = data.href;
		}
		if (data.onclick){
			ByteMind.ui.onclick(btn, function(event){
				if (data.href){
					event.preventDefault();
				}
				data.onclick(event);
			});
		}
		if (alternativeTarget){
			$(alternativeTarget).append(btn);
		}else{
			$('#bytemind-top-bar-dynamic, #bytemind-webapp-top-bar-dynamic, #bytemind-top-bar, #bytemind-webapp-top-bar').first().append(btn);
		}
		return btn;
	}

	//switch page section
	var setHistoryTimer;
	Page.switchSection = function(data, options){
		if (activeSection === data.sectionName){
			return;
		}
		var animate, replaceHistory;
		if (options){
			animate = options.animate;
			replaceHistory = options.replaceHistory;
		}
		//header title
		if (data.headerTitle){
			$('.bytemind-page-title').html(data.headerTitle);
		}
		//ui
		if (animate){
			//$('[data-bm-section="' + activeSection + '"]').fadeOut(150, function(){
			$('.bytemind-view').hide();
			$('[data-bm-section="' + data.sectionName + '"]').fadeIn(500);
		}else{
			//$('[data-bm-section="' + activeSection + '"]').hide();
			$('.bytemind-view').hide();
			$('[data-bm-section="' + data.sectionName + '"]').show();
		}
		$('.bytemind-nav-bar-button.active').removeClass('active');
		$('[data-bm-section-btn="' + data.sectionName + '"]').addClass('active');
		//meta
		if (data.title) document.title = data.title;
		if (data.description){
			$('meta[name=description]').remove();
			$('head').append( '<meta name="description" content="' + data.description + '">' );
		}
		//refresh menues
		if (Page.sideMenu){
			Page.sideMenu.refresh();
			Page.sideMenu.close();
		}
		
		//set history - TODO: this one is tricky in combination with iOS swipe-to-go-back safari-feature
		clearTimeout(setHistoryTimer);
		setHistoryTimer = setTimeout(function(){
			
			var urlParams = '';
			if (window.location.href.indexOf('?') >= 0){
				urlParams = window.location.href.replace(/.*(\?.*?)(#!|$).*/,"$1").trim();
				urlParams = urlParams.replace(/\?_escaped_fragment_=.*?(\?|&|#!|$)/,'').trim();
			}
			var newHref = (window.location.href.replace(/(\?.*?#!.*|#!.*|\?.*)/,"").trim()  + SECTION_PREFIX + data.sectionName + urlParams).trim();
			if (!replaceHistory){
				if (newHref !== window.location.href){
					history.pushState({sectionName : data.sectionName}, "", newHref);
				}
			}else{
				history.replaceState({sectionName : data.sectionName}, "", newHref);
			}
			activeSection = data.sectionName;
			
			//onPageLoad
			if (data.onPageLoad) data.onPageLoad();
		
		}, 0);
	}
	
	//import a stand-alone page via ajax call
	Page.import = function(pageTag, contentPage, contentElement, contentCssFiles, contentJsFiles, onFinishCallback){
		var content = document.getElementById(pageTag + '-page-content');
		if (content.innerHTML === ''){
			if (location.hostname === ""){
				content.innerHTML = '<p>-- Cannot dynamically load from file:// due to cross-domain restrictions. Please use webserver or localhost! --</p>';
			}else{
				if (contentCssFiles){
					$.each(contentCssFiles, function(i, contentCssFile){
						var linkElement = document.createElement("link");
						linkElement.rel = "stylesheet";
						linkElement.href = contentCssFile;
						document.head.appendChild(linkElement);
					});
				}
				if (contentJsFiles){
					var finished = 0;
					var finishedLoading = function(i, scriptFile){
						ByteMind.debug.log("Page: dynamically loaded '" + scriptFile + "'");
						finished++;
						if (finished == contentJsFiles.length){
							$(content).load(contentPage + " " + contentElement, function(){
								//done
								if (onFinishCallback) onFinishCallback(content);
							});		
						}
					}
					//add them synchronously and call onFinish in the end
					$.each(contentJsFiles, function(i, contentJsFile){
						var scriptElement = document.createElement("script");
						scriptElement.type = "text/javascript";
    					scriptElement.async = false;
						scriptElement.src = contentJsFile;
						scriptElement.onload = function(){	finishedLoading(i, contentJsFile);	};
						document.head.appendChild(scriptElement);
					});
				}else{
					$(content).load(contentPage + " " + contentElement, function(){
						//done
						if (onFinishCallback) onFinishCallback(content);
					});
				}
			}
		}
	}

	return Page;
}