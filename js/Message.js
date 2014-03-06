/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function Message() {

	Message.ERROR 			= "error";
	Message.WARNING 		= "warning";
	Message.NOTICE 			= "notice";
	Message.INFO 				= "info";

	this.mode						= "";

	this.$element;

	var self = this;
	var autoHideDelay = 5000;
	var autohideTimeout;

	this.init = function($element) {
    this.$element = $element;
 	}
	this.set = function(contents,mode,autoHide,disableEffect) {
		console.log("Message:set: ",contents,mode,autoHide,disableEffect);
		if(disableEffect) {
			self.fill(contents,mode,autoHide)
		} else{
			self.hide(function() {
				self.show();
				self.fill(contents,mode,autoHide)
			});
		}
	}
	this.fill = function(contents,mode,autoHide) {
		//console.log("Message:fill: ",text,mode,autoHide);
		self.clear();
		self.$element.html(contents);
		self.$element.addClass(mode);
		self.mode = mode;
		clearTimeout(autohideTimeout);
		if(autoHide) {
			autohideTimeout = setTimeout(function(){ self.hide()},autoHideDelay);
		}
	}
	this.clear = function($element) {
		this.$element.html("");
		this.$element.removeClass(this.mode);
	}

	this.show = function() {
		this.$element.fadeIn(200);
	}
	this.hide = function(complete) {
		this.$element.fadeOut(200,complete);
	}
}
