//requires: jQuery, Hammer.js

//sidebar
function bytemind_build_ui_sidemenu(){
	
	//add sidebar ease function
	jQuery.easing['bytemind-sidebar'] = function (x, t, b, c, d) {
		//easeOutQuad
		return -c *(t/=d)*(t-2) + b;
	}
	
	var transformSmoothing = 'transform .15s';	//when using "no transition" there is still a slight delay to smooth the pan.
	//TODO: for firefox and IE this should be 0, this also may look awkward when resizing the window!
	
	var SideMenu = function(menuSelector, options){
		var isRightBound, swipeAreas, onMenuOpen, onMenuClose, interlayer, menuButton;
		if (options){
			isRightBound = options.isRightBound;	//default menu is on the left side
			swipeAreas = options.swipeAreas;		//areas that can be used to swipe open and close the menu
			onMenuOpen = options.onOpenCallback;
			onMenuClose = options.onCloseCallback;
			interlayer = options.interlayer;
			menuButton =  options.menuButton;
			menuButtonClose = options.menuButtonClose;
		};
		
		var self = this;
		var $sidemenu = $(menuSelector);
		var $interlayer = (interlayer)? $(interlayer) : "";
		var menuWidth = $sidemenu.outerWidth();
		var panBoundary = .25; // if the pane is panned .25, switch state
		
		self.isOpen = false;
		
		self.getMenuElement = function(){
			return menuSelector;
		}
		
		var leftOrRight = 'left';		if (isRightBound) leftOrRight = 'right';
		var leftOrRightOpen = menuWidth;
		var leftOrRightClosed = 0;
		function cssLeftOrRight(value){		//TODO: remove
			var css = {};
			//reset
			css['left'] = 'auto';
			css['right'] = 'auto';
			//assign
			css[leftOrRight] = value;
			return css;
		}
		function updateLeftOrRightClosePosition(){
			leftOrRightClosed = 0;
		}
		function updateLeftOrRightOpenPosition(){
			if (leftOrRight == 'left'){
				leftOrRightOpen = menuWidth;
			}else{
				leftOrRightOpen = -menuWidth;
			}
		}
		
		var lastX = 0;
		var lastDeltaX = 0;
		var errorResetTimer;
	
		self.init = function() {
			//TODO: write a destroy function as well?
			menuWidth = $sidemenu.outerWidth();
			updateLeftOrRightClosePosition();
			updateLeftOrRightOpenPosition();
			$sidemenu.css(cssLeftOrRight(-menuWidth + 'px'));
			self.isOpen = false;
			//listen for size changes
			$(window).on('load resize orientationchange', function() {
				self.refresh();
			});
			//set interlayer button
			if ($interlayer){
				ByteMind.ui.onclick($interlayer[0], function(){
				//$interlayer.on('click', function(){
					self.close();
				});
			}
			//set menu button
			if (menuButton){
				//$(menuButton).on('click', function(){
				ByteMind.ui.onclick($(menuButton)[0], function(ev){
					if (self.isOpen){
						self.close();
					}else{
						self.open();
					}
				});
			}
			if (menuButtonClose){
				ByteMind.ui.onclick($(menuButtonClose)[0], function(){
					self.close();
				});
			}
		}
		self.refresh = function() {
			menuWidth = $sidemenu.outerWidth();
			updateLeftOrRightClosePosition();
			updateLeftOrRightOpenPosition();
			$sidemenu.css(cssLeftOrRight(-menuWidth + 'px'));
			if (self.isOpen){
				setContainerOffsetX(leftOrRightOpen, true);
			}else{
				setContainerOffsetX(leftOrRightClosed, true);
				//self.isOpen = false;
			}
		}
		
		self.setSmoothTimeMs = function(timeMs){
			transformSmoothing = ('transform .' + timeMs + 's');
		}
		
		self.open = function(skipAnimation){
			clearTimeout(errorResetTimer);
			setContainerOffsetX(leftOrRightOpen, !skipAnimation);
			if ($interlayer) $interlayer.fadeIn(300);
			self.isOpen = true;
			lastX = leftOrRightOpen;
			if (onMenuOpen) onMenuOpen();
		}
		
		self.close = function(skipAnimation){
			clearTimeout(errorResetTimer);
			setContainerOffsetX(leftOrRightClosed, !skipAnimation);
			if ($interlayer) $interlayer.fadeOut(300);
			self.isOpen = false;
			lastX = leftOrRightClosed;
			if (onMenuClose) onMenuClose();
		}
		
		function animateResetState(){
			clearTimeout(errorResetTimer);
			if (self.isOpen){
				self.open();
			}else{
				self.close();
			}
		}
		
		function setContainerOffsetX(offsetX, doTransition) {
			//stop at the edges
			if (Math.abs(offsetX) <= Math.abs(menuWidth)){
				if (doTransition) {
					$sidemenu.stop().css({
						'transition': 'transform .3s',
						'transform': 'translate3d(' + offsetX + "px" + ', 0px, 0px)'
					}).on('transitionend', function() {
						clearTimeout(errorResetTimer);
						$sidemenu.css({'transition': transformSmoothing});
					});
				}else{
					$sidemenu.stop().css({
						'transform': 'translate3d(' + offsetX + "px" + ', 0px, 0px)'
					});
				}
			}
		}
		
		function decideDirectionAndSlide(deltaX, e){
			lastDeltaX = 0;
			if (Math.abs(deltaX) > menuWidth * panBoundary) {
				if (deltaX < 0){
					if (isRightBound){
						self.open();
					}else{
						self.close();
					}
				}else{
					if (isRightBound){
						self.close();
					}else{
						self.open();
					}
				}
			}else{
				animateResetState();
			}
		}
		
		function handleHammer(e) {
			clearTimeout(errorResetTimer);
			switch (e.type) {
				case 'swipeleft':
				case 'swiperight':
					handleSwipe(e);
					break;
				case 'panleft':
				case 'panright':
				case 'panend':
				case 'pancancel':
					handlePan(e);
					break;
			}
		}

		function handleSwipe(e) {
			switch (e.direction) {
				case Hammer.DIRECTION_LEFT:
					if (isRightBound){
						self.open();
					}else{
						self.close();
					}
					break;
				case Hammer.DIRECTION_RIGHT:
					if (isRightBound){
						self.close();
					}else{
						self.open();
					}
					break;
				default:
					decideDirectionAndSlide(lastDeltaX, e);
			}
			$.each(hammers, function(index, hammer){
				hammer.stop(true);
			});
			errorResetTimer = setTimeout(function(){
				lastDeltaX = 0;
				animateResetState();
			}, 450);
		}
		
		function handlePan(e) {
			switch (e.type) {
				case 'panleft':
				case 'panright':
					lastDeltaX = e.deltaX;
					setContainerOffsetX(lastX + e.deltaX);
					break;
				case 'panend':
				case 'pancancel':
					decideDirectionAndSlide(e.deltaX, e);
					break;
				default:
					decideDirectionAndSlide(lastDeltaX, e);
			}
		}
		
		var hammers = [];
		if (swipeAreas && swipeAreas.length > 0){
			$.each(swipeAreas, function(index, area){
				var hammer = new Hammer($(area)[0]).on('swipeleft swiperight panleft panright panend pancancel', handleHammer);
				hammers.push(hammer);
			});
		}else{
			var hammer = new Hammer($sidemenu[0]).on('swipeleft swiperight panleft panright panend pancancel', handleHammer);
			hammers.push(hammer);
		}
		
		self.unbind = function() {
			$.each(hammers, function(index, hammer){
				hammer.off();
			});
			hammers = [];
		}
	}
	return SideMenu;
}