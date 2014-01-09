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
		// var hoi = "fijn";

		var updateCursor = function(e) {
			// console.log(e.offsetX);
			if (e.offsetX!=undefined) _x = e.offsetX;
			if (e.offsetY!=undefined) _y = e.offsetY;
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
				console.log("_x")
				//warning... _x or _y not set...
			}
		}
		 
		var onTouchStart = function(e) {
			updateCursor(e);
			startDownTimer();
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
			console.log("onStartDrag");
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
