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
    console.log("Message:init");
    
    this.$element = $element;
    console.log("$element: ",$element);
 	}
	
	this.set = function(text,mode,autoHide) {
		console.log("Message:set: ",text,mode,autoHide);
		self.hide(function() {
			self.show();
			self.clear();
			
			self.$element.text(text);
			self.$element.addClass(mode);
			self.show();
			
			self.mode = mode;
			
			clearTimeout(autohideTimeout);
			if(autoHide) {
				autohideTimeout = setTimeout(function(){ self.hide()},autoHideDelay);
			}
		});
	}
	this.clear = function($element) {
		this.$element.text("");
		this.$element.removeClass(this.mode);
	}
	
	this.show = function() {
		this.$element.fadeIn(200);
	}
	this.hide = function(complete) {
		this.$element.fadeOut(200,complete);
	}
}