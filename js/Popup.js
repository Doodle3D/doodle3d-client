function Popup(element,mask) {
	
	var self = this;
	
	this.open = function(complete,disableMaskClick) {
		mask.fadeIn(POPUP_SHOW_DURATION);
		element.fadeIn(POPUP_SHOW_DURATION, complete);
		keyboardShortcutsEnabled=false;
		document.body.removeEventListener('touchmove',prevent,false);
		mask.bind("onButtonClick", function() { self.close() });
	}
	this.close = function(complete) {
		mask.fadeOut(POPUP_SHOW_DURATION);
		element.fadeOut(POPUP_SHOW_DURATION,complete);
		
		keyboardShortcutsEnabled=true;	
		document.body.addEventListener('touchmove',prevent,false);
		mask.unbind("onButtonClick");
	}
}