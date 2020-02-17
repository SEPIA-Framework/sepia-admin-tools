//requires: jQuery, Hammer.js

//Pane carousel
function bytemind_build_ui_carousel(){
	//copied from SepiaFW
	
	/* example:
	<div id="carousel">
		<div class="carousel-container">
			<div class='carousel-pane'>Page 1</div>
			<div class='carousel-pane'>Page 2</div>
		</div>
	</div>
	
	var c = new SepiaFW.ui.Carousel('#carousel');
	c.init();
	c.showPane(0);
	
	Put this style somewhere in your code:
	#yourView .carousel-container.transition {
		transition: left .4s ease-out;
	}
	*/
	
	//add carousel ease function
	jQuery.easing['bytemind-carousel'] = function (x, t, b, c, d) {
		//easeOutQuad
		return -c *(t/=d)*(t-2) + b;
	}
	
	var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
	
	var transformSmoothing = 'transform .15s';	//when using "no transition" there is still a slight delay to smooth the pan.
	//TODO: for firefox and IE this should be 0, this also may look awkward when resizing the window!
	
	//Basis for this code is taken from the nice Hammer.js carousel demo: https://jsfiddle.net/Richard_Liu/7cqqcrmm/
	var Carousel = function(carouselSelector, swipeAreas, onPaneSet) {
		var self = this;
		var $carousel = $(carouselSelector);							$carousel.css({ display : 'block' });		//required style
		var $container = $('.carousel-container', carouselSelector);	$container.css({ position : 'relative' });	//required style
		var $panes = $('.carousel-pane', carouselSelector);				$panes.css({ float : 'left' });				//required style

		var paneWidth = 0;
		var paneHeight = 0;
		var paneCount = $panes.length;
		var panBoundary = .25; // if the pane is panned .25, switch to the next pane.

		var currentPane = 0;
		
		var lastDeltaX = 0;
		var errorResetTimer;

		function setPaneSize() {
			paneWidth = $carousel.outerWidth();
			paneHeight = $carousel.outerHeight();
			$panes.each(function(i) {
				$(this).outerWidth(paneWidth);
				$(this).outerHeight(paneHeight);
			});
			$container.outerWidth(paneWidth * paneCount);
			$container.outerHeight(paneHeight);
		}

		self.init = function() {
			//TODO: write a "destroy" function as well?
			setPaneSize();
			$(window).on('load resize orientationchange', function() {
				setPaneSize();
				//self.showPane(currentPane);
				setContainerOffsetX(-currentPane * paneWidth, false);
			});
		}
		self.refresh = function() {
			setPaneSize();
			self.showPane(currentPane);
		}
		self.unbind = function() {
			$.each(hammers, function(index, hammer){
				hammer.off();
			});
			hammers = [];
		}
		
		self.setSmoothTimeMs = function(timeMs){
			transformSmoothing = ('transform .' + timeMs + 's');
		}

		self.showPane = function(index) {
			currentPane = Math.max(0, Math.min(index, paneCount - 1));
			setContainerOffsetX(-currentPane * paneWidth, true);
			//pane set callback
			if (onPaneSet) onPaneSet(currentPane);
		}

		function setContainerOffsetX(offsetX, doTransition) {
			if (doTransition) {
				/*
				$container
					.addClass('transition')
					.one(transitionEnd, function() {
						$container.removeClass('transition');
						clearTimeout(errorResetTimer);
					})
				*/
				/*
				$container.stop().animate({left: offsetX + "px"}, 300, 'bytemind-carousel', function(){
					clearTimeout(errorResetTimer);
				});
				*/
				$container.stop().css({
					'transition': 'transform .3s',
					'transform': 'translate3d(' + offsetX + "px" + ', 0px, 0px)'
				}).on('transitionend', function() {
					clearTimeout(errorResetTimer);
					$container.css({'transition': transformSmoothing});	//TODO: for firefox and IE this should be 0, this also may look awkward when resizing the window!
				});
			}else{
				/*
				$container.stop().css({
					left: offsetX
				});
				*/
				$container.stop().css({
					'transform': 'translate3d(' + offsetX + "px" + ', 0px, 0px)'
				});
			}
		}

		self.next = function() {
			self.showPane(++currentPane);
		}
		self.prev = function() {
			self.showPane(--currentPane);
		}

		self.getCurrentPane = function() {
			return currentPane;
		}
		self.getNumberOfPanes = function() {
			return paneCount;
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
					self.next();
					break;
				case Hammer.DIRECTION_RIGHT:
					self.prev();
					break;
				default:
					decideDirectionAndSlide(lastDeltaX); 		//TODO: remove?
			}
			$.each(hammers, function(index, hammer){
				hammer.stop(true);
			});
			errorResetTimer = setTimeout(function(){
				lastDeltaX = 0;
				self.showPane(currentPane);
			}, 450);
		}
	  
		function outOfBound() {
			var left = $container.position().left;
			return (currentPane == 0 && left >= 0) ||
				(currentPane == paneCount - 1 && left <= -paneWidth * (paneCount - 1));
		}

		function handlePan(e) {
			if (Math.abs(lastDeltaX - e.deltaX) > 50){
				return;
			}
			switch (e.type) {
				case 'panleft':
				case 'panright':
					lastDeltaX = e.deltaX;
					// Slow down at the first and last pane.
					if (outOfBound()) {
						e.deltaX *= .2;
					}
					setContainerOffsetX(-currentPane * paneWidth + e.deltaX);
					//console.log(-currentPane * paneWidth + e.deltaX);
					break;
				case 'panend':
				case 'pancancel':
					decideDirectionAndSlide(e.deltaX);
					break;
				default:
					decideDirectionAndSlide(lastDeltaX);
			}
		}
		
		function decideDirectionAndSlide(deltaX){
			lastDeltaX = 0;
			if (Math.abs(deltaX) > paneWidth * panBoundary) {
				if (deltaX > 0) {
					self.prev();
				}else{
					self.next();
				}
			}else{
				self.showPane(currentPane);
			}
		}
		
		var hammers = [];
		if (swipeAreas && swipeAreas.length > 0){
			$.each(swipeAreas, function(index, area){
				var hammer = new Hammer($(area)[0]).on('swipeleft swiperight panleft panright panend pancancel', handleHammer);
				hammers.push(hammer);
			});
		}else{
			var hammer = new Hammer($carousel[0]).on('swipeleft swiperight panleft panright panend pancancel', handleHammer);
			hammers.push(hammer);
		}
	}
	
	return Carousel;
}