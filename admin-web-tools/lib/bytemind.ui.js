//UI
function bytemind_build_ui(){
	var UI = {};
	UI.version = "0.9.0";
	
	//client info
	UI.isCordova = ('cordova' in window);
	UI.isTouchDevice = false;
	UI.isAndroid = false;
	UI.isIOS = false;
	UI.isMobile = false;
	UI.isStandaloneWebApp = false;
	UI.isChromeDesktop = false;
	UI.isSafari = false;
	UI.isEdge = false;
	
	//setup UI components and client variables
	UI.setup = function(){
		//is touch device?
		if ("ontouchstart" in document.documentElement){
			UI.isTouchDevice = true;
			document.documentElement.className += " bytemind-touch-device";
		}else{
			UI.isTouchDevice = false;
			document.documentElement.className += " bytemind-notouch-device";
		}
		//is Android or Chrome?
		UI.isAndroid = (UI.isCordova)? (device.platform === "Android") : (navigator.userAgent.match(/(Android)/ig)? true : false);
		UI.isChrome = (/Chrome/gi.test(navigator.userAgent)) && !(/Edge/gi.test(navigator.userAgent));
		//is iOS or Safari?
		UI.isIOS = (UI.isCordova)? (device.platform === "iOS") : (/iPad|iPhone|iPod/g.test(navigator.userAgent) && !window.MSStream);
		UI.isSafari = /Safari/g.test(navigator.userAgent) && !UI.isAndroid && !UI.isChrome; //exclude iOS chrome (not recommended since its still appleWebKit): && !navigator.userAgent.match('CriOS');
		//is Chrome Desktop?
		if (UI.isChrome && !UI.isAndroid){
			UI.isChromeDesktop = true;
		}
		//is Edge?
		UI.isEdge = (/Edge/gi.test(navigator.userAgent));
		//is mobile?
		UI.isMobile = !UI.isEdge && !UI.isChromeDesktop && (UI.isAndroid || UI.isIOS);
		if (UI.isMobile){
			document.documentElement.className += " bytemind-mobile-device";
		}
		//is standalone app?
		UI.isStandaloneWebApp = isStandaloneWebApp();
		function isStandaloneWebApp(){
			if (UI.isCordova){
				isStandalone = true;
			}else{
				var urlParam = ByteMind.page.getURLParameter("isApp");
				if (urlParam && urlParam == "true"){
					urlParam = true;
				}
				var google = window.matchMedia('(display-mode: standalone)').matches;
				var apple = window.navigator.standalone;
				var isStandalone = (urlParam || google || apple);
			}
			if (isStandalone){
				document.documentElement.className += " bytemind-standalone-app";
			}
			return isStandalone;
		}
		
		//set client
		ByteMind.config.clientInfo = (((UI.isIOS)? 'iOS_' : '') 
							+ ((UI.isAndroid)? 'android_' : '') 
							+ ((UI.isChromeDesktop)? 'chrome_' : '')
							+ ((UI.isSafari)? 'safari_' : '')
							+ ((UI.isEdge)? 'edge_' : '')
							+ ((UI.isStandaloneWebApp)? "app_" : "browser_") + ("v" + UI.version));
	}
	
	//make auto-resize swipe bar
	UI.makeAutoResizeSwipeArea = function(selector, onClickCallback){
		var $swipeArea = $(selector);
		var didDown = false;	var didUp = false;
		var xDown = 0;			var xUp = 0;
		var yDown = 0;			var yUp = 0;
		$swipeArea.mouseup(function(event){			up(this, event);
			}).mousedown(function(event){			down(this, event);
			//}).on('touchstart', function(event){	console.log('touchstart'); down(this, event);
			//}).on('touchend', function(event){		console.log('touchend'); up(this, event);
			});
		function down(that, ev){
			if (!didDown){
				didDown = true;
				didUp = false;
				xDown = (ev.center)? ev.center.x : ev.clientX;
				yDown = (ev.center)? ev.center.y : ev.clientY;
				$(that).addClass('bytemind-swipe-active');
				//console.log(ev);
			}
		}
		function up(that, ev){
			if (!didUp){
				didUp = true;
				xUp = (ev.center)? ev.center.x : ev.clientX;
				yUp = (ev.center)? ev.center.y : ev.clientY;
				$(that).removeClass('bytemind-swipe-active');
				var moved = (xDown-xUp)*(xDown-xUp) + (yDown-yUp)*(yDown-yUp);
				//console.log(moved);
				if (moved < 100){
					click(ev);
				}
				resetTimer = setTimeout(function(){
					didDown = false;
				}, 500);
			}
		}
		function click(ev){
		//UI.onclick($swipeArea[0], function(ev){
			if (onClickCallback){
				onClickCallback(ev);
			}
			var x = (ev.center)? ev.center.x : ev.clientX;
			var y = (ev.center)? ev.center.y : ev.clientY;
			var that = $swipeArea[0];
			var thatDisplay = that.style.display;
			that.style.display = 'none';
			var elementMouseIsOver = document.elementFromPoint(x, y);
			//console.log(elementMouseIsOver.id);
			
			//Hammer(elementMouseIsOver).emit("tap", ev);
			$(elementMouseIsOver).trigger('click', { bm_force : true });
			//elementMouseIsOver.dispatchEvent(makeClickEvent(x, y));
			setTimeout(function(){
				that.style.display = thatDisplay;
			}, 500);
		}
		return $swipeArea[0];
	}
	function makeClickEvent(x, y){
		var evt = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: x,
			clientY: y
			/* whatever properties you want to give it */
		});
		return evt;
	}
	
	//loading animation
	var loaderTimer;
	UI.showLoader = function(noDelay, parentEle){
		//get/create
		var parent = (parentEle)? parentEle : document.body;
		var $loader = $('#bytemind-loader');
		if ($loader.length < 1){
			var loader = document.createElement('div');
			loader.id = 'bytemind-loader';
			parent.appendChild(loader);
			$loader = $(loader);
		}
		//handle
		if (noDelay){
			$loader.show();
		}else{
			loaderTimer = setTimeout(function(){ 
				$loader.show();
			}, 750);
		}
	}
	UI.hideLoader = function(){
		clearTimeout(loaderTimer);
		$('#bytemind-loader').hide();
	}
	
	var backgroundCoverLayers = 0;
	UI.showBackgroundCoverLayer = function(parentEle){
		//TODO: this can only existe once, different parents will most likely create unexpected behaviour
		var $cover = $('#bytemind-background-cover-layer');
		if ($cover.length < 1){
			var parent = (parentEle)? parentEle : document.body;
			var cover = document.createElement('div');
			cover.id = 'bytemind-background-cover-layer';
			$(parent).append(cover);
			$cover = $(cover);
		}
		if ($cover.css('display') == 'none'){
			$cover.fadeIn(300);
			backgroundCoverLayers++;
		}
	}
	UI.hideBackgroundCoverLayer = function(){
		backgroundCoverLayers--;
		if (backgroundCoverLayers < 1){
			$('#bytemind-background-cover-layer').fadeOut(300).off();
			backgroundCoverLayers = 0;
		}
	}
	
	//Create/show message popup
	UI.showPopup = function(content, config, parentEle){
		//get/create
		var parent = (parentEle)? parentEle : document.body;
		var $box = $('#bytemind-popup-message');
		if ($box.length < 1){
			var box = document.createElement('div');
			box.id = 'bytemind-popup-message';
			box.innerHTML = "<div id='bytemind-popup-message-content'></div>" +
							"<span id='bytemind-popup-message-close-small'>x</span>" +
							"<button id='bytemind-popup-message-btn-one'>OK</button>" +
							"<button id='bytemind-popup-message-btn-two'>ABORT</button>";
			parent.append(box);
			$box = $(box);
		}
		//handle
		var buttonOneName, buttonOneAction, buttonTwoName, buttonTwoAction;
		var primaryColor, secondaryColor;
		var useSmallCloseButton = false;
		var requireSelection;
		if (config){
			useSmallCloseButton = config.useSmallCloseButton;
			buttonOneName = config.buttonOneName;
			buttonOneAction = config.buttonOneAction;
			buttonTwoName = config.buttonTwoName;
			buttonTwoAction = config.buttonTwoAction;
			primaryColor = config.primaryColor;
			secondaryColor = config.secondaryColor;
			requireSelection = config.requireSelection;
			if (requireSelection == undefined && useSmallCloseButton) requireSelection = false;
			if (requireSelection == undefined && buttonTwoName && buttonTwoAction) requireSelection = true;
		}
		if (useSmallCloseButton){
			$('#bytemind-popup-message-close-small').off().show().on('click', function(){ UI.hidePopup(); });
		}else{
			$('#bytemind-popup-message-close-small').off().hide();
		}
		if (buttonOneName && buttonOneAction){
			var btn1 = $('#bytemind-popup-message-btn-one');
			btn1.html(buttonOneName);	
			btn1.off().show().on('click', buttonOneAction);
		}else if (useSmallCloseButton){
			$('#bytemind-popup-message-btn-one').off().hide();
		}else{
			var btn1 = $('#bytemind-popup-message-btn-one');
			btn1.html('OK');			
			btn1.off().show().on('click', function(){ 
				UI.hidePopup(); 
			});
		}
		if (buttonTwoName && buttonTwoAction){
			var btn2 = $('#bytemind-popup-message-btn-two');
			btn2.html(buttonTwoName).show();	
			btn2.off().show().on('click', function(){	
				buttonTwoAction(this); 	
				UI.hidePopup();		
			});
		}else{
			$('#bytemind-popup-message-btn-two').off().hide();
		}
		$('#bytemind-popup-message-content').html(content);
		UI.showBackgroundCoverLayer(parent);
		$('#bytemind-background-cover-layer').off().on('click', function(){
			if (!requireSelection){
				UI.hidePopup();
			}
		});
		$box.fadeIn(300);
		return $box[0];
	}
	UI.hidePopup = function(){
		$('#bytemind-popup-message').fadeOut(300, function(){
			$('#bytemind-popup-message-content').html("");
		});
		UI.hideBackgroundCoverLayer(parent);
	}
	
	//Simple tap with reduced delay for e.g. iOS' UIWebView - note: try using WKWebView whenever u can, this fast-click has some issues e.g. with "editable" divs
	UI.useFastTouch = false;
	UI.onclick = function(ele, callback){
		if (UI.useFastTouch){
			UI.longPressShortPressDoubleTap(ele, '', '', callback);
			//this prevents the ghost-click but leads to a more complicated trigger event, use: $(ele).trigger('click', {bm_force : true})
			$(ele).on('click', function(ev, data){
				if (data && data.bm_force){
					callback(ev);
				}else{
					ev.preventDefault();
				}
			});
			//PreventGhostClick(ele);
		}else{
			$(ele).on('click', function(ev){
				callback(ev);
			});
		}
	}
	//Long-press / Short-press / Double-Tap combo
	UI.longPressShortPressDoubleTap = function(ele, callbackLong, callbackLongRelease, callbackShort, callbackDouble, useLongPressIndicator, preventTapOnDoubleTap){
		//Hammertime!
		var pressTimer;
		var delay = 625;
		var mc = new Hammer.Manager($(ele)[0]);
		mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
		mc.add(new Hammer.Tap());
		mc.add(new Hammer.Press({ event: 'firstpress', time : 300}));
		mc.add(new Hammer.Press({ time : delay}));
		
		if (preventTapOnDoubleTap){
			mc.get('tap').requireFailure('doubletap');		//use this to prevent a 'tap' together with 'doubletap' ... but to introduce a delay on tap
		}

		//if (callbackShort) mc.on("tap", callbackShort);
		if (callbackShort) mc.on("tap", function(ev){
			if (useLongPressIndicator) UI.hidelongPressIndicator();
			callbackShort(ev);
			//console.log('tab');
		});
		if (callbackDouble) mc.on("doubletap", function(ev){
			if (useLongPressIndicator) UI.hidelongPressIndicator();
			callbackDouble(ev);
			//console.log('doubletab');
		});
		if (callbackLong) mc.on("firstpress", function(ev){ 
			if (useLongPressIndicator){ 
				UI.showlongPressIndicator(ev);
				pressTimer = setTimeout(UI.hidelongPressIndicator, delay);
			}
			//console.log('firstpress');
		});
		if (callbackLong) mc.on("press", function(ev){ 
			callbackLong(ev); 
			//console.log('press');
		});
		if (callbackLong) mc.on("firstpressup", function(ev){ 
			clearTimeout(pressTimer);
			if (useLongPressIndicator) UI.hidelongPressIndicator(); 
			if (callbackLongRelease) callbackLongRelease(ev);
			//console.log('pressup');
		});
		//maybe even easier?
		/*mc.on("hammer.input", function(ev) {
		   console.log(ev.pointers);
		});*/
	}
	//Long-press indicator
	var longPressIndicator = '';
	var longPressIndicatorTimer;
	UI.showlongPressIndicator = function(ev){
		//TODO: disable for iOS or fix
		var indi = document.createElement('div');
		indi.className = 'bytemind-long-press-indicator';
		$(document.body).append(indi);
		indi.style.top = ev.center.y + "px";
		indi.style.left = ev.center.x + "px";
		longPressIndicatorTimer = setTimeout(function(){
			$(indi).addClass('grow');
		}, 310);
	}
	UI.hidelongPressIndicator = function(){
		clearTimeout(longPressIndicatorTimer);
		$('.bytemind-long-press-indicator').remove();
	}
	
	return UI;
}