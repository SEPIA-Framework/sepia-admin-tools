//---BUILD PAGE---

$(document).ready(function(){
	//-- Chrome/Android (and whoever will support it) --
	
	//PWA Setup: register service worker in non-Cordova app only for now
	if('serviceWorker' in navigator){
		navigator.serviceWorker
			.register('sw.js')
			.then(function(){ 
				console.log('SEPIA Control HUB - Service Worker: Registered');
			}, function(err){
				console.error('SEPIA Control HUB - Service Worker: Failed to register', err);
			});
	}else{
		console.log('SEPIA Control HUB - Service Worker: Not available');
	}
	//handle PWA popup for home-screen installation
	/*
	window.addEventListener('beforeinstallprompt', function(e) {
		//e.preventDefault(); 		//use this to prevent pop-up
		return false;
	});
	*/
	
	//-- ByteMind --
	
	//load plugins
    ByteMind.buildPlugins();
	
	//setup page
	ByteMind.ui.setup();
	buildNavigation();

	//translate page
	if (ByteMind.local){
		ByteMind.local.translateAll();
	}
	
	//Setup Webservice class
	if (ByteMind.webservice && setupWebserviceClass){
		setupWebserviceClass();		//from index.js
	}
	
	//setup Account class
	if (ByteMind.account && setupAccountClass){
		setupAccountClass();		//from index.js
	}
	
	//debug
	var clientInfo = document.createElement('span');
	clientInfo.innerHTML = ByteMind.config.clientInfo;
	$(clientInfo).css({position:'absolute', bottom:'4px', right:'4px', opacity:'0.33', 'font-size':'11px'});
	$('#credits').append(clientInfo);
	
	//check page actions and register hashchange event listener
	if (!ByteMind.page.checkUrlForAction()){
		ByteMind.page.activateActionByName(HOME, { animate:false, replaceHistory:true });
	}
	window.onhashchange = function(){
		ByteMind.page.checkUrlForAction();
	};
	
	//refresh
	ByteMind.ui.onclick(document.getElementById('bytemind-refresh-btn'), function(){
		window.location.reload(true);
	});
		
	//fullscreen
	$('#bytemind-fullscreen-btn, #bytemind-fullscreen-overlay-btn').each(function(){
		ByteMind.ui.onclick(this, function(){
			$('#bytemind-webapp-header').toggleClass('hide');
			$('#bytemind-webapp-top-bar').toggleClass('hide');
			$('#bytemind-webapp-footer').toggleClass('hide');
			$('#bytemind-fullscreen-overlay-btn').fadeToggle(300);
			$('.hide-on-full-screen').fadeToggle(300);
			$('body').toggleClass('full-width');
			setTimeout(function(){
				window.dispatchEvent(new Event('resize'));
			}, 320);
		});
	});
	
	//App info
	$('#control-hub-version').html(controlHubVersion);
	
	//From index.js (run before ByteMind.account tries to restore account data)
	if (ByteMind.account && beforeLoginRestore){
		beforeLoginRestore();
	}
	
	//Open login box
	if (ByteMind.account){
		ByteMind.account.setup();
	}
	
	//From index.js (your stuff)
	if (onStart){
		onStart();
	}
});

function buildNavigation(){
	var menuBar = document.getElementById('bytemind-webapp-top-bar');
	var menuBarDyn = document.getElementById('bytemind-webapp-top-bar-dynamic');
	
	//Side menu
	var sideMenuEle = document.getElementById('my-bytemind-side-menu');
	var swipeArea = ByteMind.ui.makeAutoResizeSwipeArea(document.getElementById('my-bytemind-side-menu-swipe'), function(){
		//console.log('tap');
	});
	var sideMenuOptions = {
		isRightBound : false,					//default menu is on the left side, if you change it make sure to use a right-bound swipeArea as well!
		swipeAreas : [sideMenuEle, swipeArea],	//areas that can be used to swipe open and close the menu
		onOpenCallback : function(){},
		onCloseCallback : function(){},
		interlayer : '#my-bytemind-side-menu-interlayer',
		menuButton : '#bytemind-menu-btn-ctrl',
		menuButtonClose : '#my-bytemind-menu-close'
	};
	ByteMind.page.sideMenu = new ByteMind.ui.SideMenu(sideMenuEle, sideMenuOptions);
	ByteMind.page.sideMenu.init();
	
	//Pages:
	
	//From index.js
	if (buildPages){
		buildPages(sideMenuEle);
	}
	
	//Add logout button?
	if (ByteMind.account){
		ByteMind.page.registerMenuButton("Sign out", {
			//href : "/logout.html",
			onclick : function() { ByteMind.page.sideMenu.close(); 	ByteMind.account.logoutAction(); }
		}, sideMenuEle);
	}
	
	//use side menu?
	/*
	menuButtonsTotalWidth = 48;
	$(menuBar).children().each(function(){
		menuButtonsTotalWidth += $(this).outerWidth(true);
	});
	refreshNavigation(menuBar, ByteMind.page.sideMenu);
	$(window).on('load resize orientationchange', function() {
		refreshNavigation(menuBar, ByteMind.page.sideMenu);
	});
	*/
}
/*
var useSideMenu = false;
var menuButtonsTotalWidth;
function refreshNavigation(menuBar, sideMenu){
	var sideMenuEle = sideMenu.getMenuElement();
	if (!sideMenuEle){
		return;
	}
	var mainWidth = $(menuBar).outerWidth();
	var $menuBarDyn = $(menuBar).find('#bytemind-webapp-top-bar-dynamic');		//TODO: make non constant
	
	if (!useSideMenu){
		if (mainWidth <= menuButtonsTotalWidth){
			useSideMenu = true;
			var menuButtons = $menuBarDyn.find('.bytemind-nav-bar-button').not('#bytemind-menu-btn-ctrl');
			menuButtons.detach();
			menuButtons.appendTo(sideMenuEle);

			sideMenu.refresh();
			sideMenu.close(true);

			$('#bytemind-menu-btn-ctrl').show();
			//make exceptions for iOS
			if (!ByteMind.ui.isSafari || ByteMind.ui.isStandaloneWebApp){
				$('#my-bytemind-side-menu-swipe').show();
			}else{
				$('#my-bytemind-side-menu-swipe').hide();
			}
		}
	}else{
		if (mainWidth > menuButtonsTotalWidth){
			useSideMenu = false;
			var menuButtons = $(sideMenuEle).find('.bytemind-nav-bar-button').not('#bytemind-menu-btn-ctrl');
			menuButtons.detach();
			menuButtons.appendTo($menuBarDyn[0]);
			
			sideMenu.refresh();
			sideMenu.close(true);

			$('#bytemind-menu-btn-ctrl').hide();
			//make exceptions for iOS
			if (!ByteMind.ui.isSafari || ByteMind.ui.isStandaloneWebApp){
				$('#my-bytemind-side-menu-swipe').hide();
			}else{
				$('#my-bytemind-side-menu-swipe').show();
			}
		}
	}
}
*/
