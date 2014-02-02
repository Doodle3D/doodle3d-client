/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

// prototype inheritance 
// http://robertnyman.com/2008/10/06/javascript-inheritance-how-and-why/
Button.prototype = new jQuery();
function Button() {
	
	this.enabled = true;
	
	var _clickEnabled = true;
	var _downTimerFPS = 20;
	var _timer;
	var _x,_y;
	var _isDown = false;
	var _self = this;
		
	// call jQuery constuctor 
	// http://blog.santoshrajan.com/2008/10/what-john-resig-did-not-tell-you.html
	this.constructor.prototype.init.apply(this, arguments);
	
	// prevent multiple event handlers etc
	//	make sure you do a more general conversion last
	if(this.data("isButton")) {
		return;
	} else {
		this.data("isButton",true);
	}
	
	this.enable = function() {
		if(_self.enabled === true) { return; } 
		_self.removeClass("disabled");
		_self.enabled = true;
	};
	this.disable = function() {
		if(_self.enabled === false) { return; }
		_self.addClass("disabled");
		_self.enabled = false;
	};
	// if the element starts with a disable class, we properly disable it
	if(this.hasClass("disabled")) {
		this.disable();
	}
	
	function updateCursor(e) {
		// retrieve cursor position relative to element
		if (e.offsetX !== undefined) {
			_x = e.offsetX;
			_y = e.offsetY;
		} else {
			var offset = _self.offset();
			if(e.pageX !== undefined) {
				// http://www.quirksmode.org/mobile/tableViewport_desktop.html#t11
				_x = e.pageX - offset.left;
				_y = e.pageY - offset.top;
			} else if(e.originalEvent !== undefined && e.originalEvent.pageX !== undefined) {
				//http://css-tricks.com/the-javascript-behind-touch-friendly-sliders/
				_x = e.originalEvent.pageX - offset.left;
				_y = e.originalEvent.pageY - offset.top;
			}
		
			//android+chrome-specific hack	
			if (e.originalEvent.changedTouches !== undefined) {
				_x = e.originalEvent.changedTouches[0].pageX - offset.left;
				_y = e.originalEvent.changedTouches[0].pageY - offset.top;
			}
		}
	}
	function startDownTimer() {
		if (_timer === undefined) {
			_timer = setInterval(onDownTimerInterval, 1000/_downTimerFPS);
			_isDown = true;
		}
	}
	function stopDownTimer() {
		clearInterval(_timer);
		_timer = undefined;
		_isDown = false;
		// _x = undefined;
		// _y = undefined;
	}
	function onDownTimerInterval() {
		if(!_self.enabled) { return; }
		if (_x !== undefined && _y !== undefined) {
			_self.trigger("onButtonHold",{x:_x,y:_y});
		} else {
			console.log("Button: warning... _x or _y not set...");
		}
	}
	
	// Event handlers
	$(document).mouseup(function(e) {
		stopDownTimer();
	});
	this.on("touchstart", function(e) {
		if(!_self.enabled) { return; }
		_clickEnabled = false;
		updateCursor(e);
		startDownTimer();
		_self.trigger("onButtonClick",{x:_x,y:_y});
		e.preventDefault();
	});
	this.on("touchend", function(e) {
		updateCursor(e);
		stopDownTimer();
	});
	this.on("touchmove", function(e) {
		if(!_self.enabled) { return; }
		updateCursor(e);
		startDownTimer();
	});
	this.mousedown(function(e) {
		if(!_self.enabled) { return; }
		updateCursor(e);
		startDownTimer();
	});
	this.mouseup(function(e) {
		updateCursor(e);
		stopDownTimer();
	});
	this.mousemove(function(e) {
		if(!_self.enabled) { return; }
		updateCursor(e);
		//if (_isDown) mousedrag(e);
	});
	//this.mousedrag(function(e) {
	//	updateCursor(e);
	//});
	this.contextmenu(function(e) {
		e.preventDefault();
	});
	this.click(function(e) {
		if(!_self.enabled || !_clickEnabled) { return; }
		updateCursor(e);
		stopDownTimer();
		_self.trigger("onButtonClick",{x:_x,y:_y});
	});
}

// to work with multiple objects we need a jQuery plugin
$.fn.Button = function() {
	return $(this).each(function(){
		new Button(this);
	});
};