(function($) {


	$.fn.Button = function() {
		return $(this).each(function(){
			$.Button($(this)[0]);
		});
	};

	$.Button = function(element) {
		var downTimerFPS = 20;
		var _timer = undefined;
		var _x,_y;
		var isDown = false;

		var updateCursor = function(e) {
			// retrieve cursor position relative to element
			if (e.offsetX != undefined) {
				_x = e.offsetX;
				_y = e.offsetY;
			} else if(e.pageX != undefined) {
				// http://www.quirksmode.org/mobile/tableViewport_desktop.html#t11
				var offset = $(element).offset();
				_x = e.pageX - offset.left;
				_y = e.pageY - offset.top;
			} else if(e.originalEvent != undefined && e.originalEvent.pageX != undefined) {
				//http://css-tricks.com/the-javascript-behind-touch-friendly-sliders/
				var offset = $(element).offset();
				_x = e.originalEvent.pageX - offset.left;
				_y = e.originalEvent.pageY - offset.top;
			}
			
			//android+chrome-specific hack
			if (e.originalEvent.changedTouches != undefined) {
				_x = e.originalEvent.changedTouches[0].pageX - offset.left;
				_y = e.originalEvent.changedTouches[0].pageY - offset.top;
			}
		}

		var startDownTimer = function() {
			if (_timer==undefined) {
				_timer = setInterval(onDownTimerInterval, 1000/downTimerFPS);
				isDown = true;
			}
		}

		var stopDownTimer = function() {
			clearInterval(_timer);
			_timer = undefined;
			isDown = false;
			// _x = undefined;
			// _y = undefined;
		}

		var onDownTimerInterval = function() {
			if (_x!=undefined && _y!=undefined) {
				$(element).trigger("onButtonHold",{x:_x,y:_y});
			} else {
				console.log("Button: warning... _x or _y not set...");
			}
		}
		 
		var onTouchStart = function(e) {
			updateCursor(e);
			startDownTimer();
			$(element).trigger("onButtonClick",{x:_x,y:_y});
			e.preventDefault();
		}

		var onTouchEnd = function(e) {
			updateCursor(e);
			stopDownTimer();
		}

		var onTouchMove = function(e) {
			updateCursor(e);
			startDownTimer();
		}

		var onMouseDown = function(e) {
			updateCursor(e);
			startDownTimer();
		}

		var onMouseUp = function(e) {
			updateCursor(e);
			stopDownTimer();
		}

		var onMouseMove = function(e) {
			updateCursor(e);
			if (isDown) onMouseDrag(e);
		}

		var onMouseDrag = function(e) {
			updateCursor(e);
		}

		var onDocumentMouseUp = function(e) {
			stopDownTimer();
		}

		var onClick = function(e) {
			updateCursor(e);
			stopDownTimer();
			$(element).trigger("onButtonClick",{x:_x,y:_y});
		}

		var onStartDrag = function(e) {
		}

		var onContextMenu = function(e) {
			e.preventDefault();
		}

		//this needs to be done after the function declarations

		$(element).bind({
			touchstart: onTouchStart,
			touchend: onTouchEnd,
			touchmove: onTouchMove,
			mousedown: onMouseDown,
			mouseup: onMouseUp,
			mousemove: onMouseMove,
			contextmenu: onContextMenu,
			click: onClick
		});

		$(document).on("mouseup", onDocumentMouseUp);
		$(element).css("-webkit-user-select","none");
		$(element).css("-webkit-touch-callout","none");

	}
	
}(jQuery));
