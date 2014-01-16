function Popup(element, mask) {
	var self = this;
	var escapeKeyHandler = null;
	var enterKeyHandler = null;
	
	this.open = function(complete, disableMaskClick) {
		mask.fadeIn(POPUP_SHOW_DURATION);
		element.fadeIn(POPUP_SHOW_DURATION, complete);
		
		keyboardShortcutsEnabled = false;
		keyboardEscapeEnterEnabled = true;
		
		document.body.removeEventListener('touchmove', prevent, false);
		mask.bind("onButtonClick", function() { self.close() });
		if (escapeKeyHandler) $(document).bind("onEscapeKey", escapeKeyHandler);
		if (enterKeyHandler) $(document).bind("onEnterKey", enterKeyHandler);
	}
	
	this.close = function(complete) {
		mask.fadeOut(POPUP_SHOW_DURATION);
		element.fadeOut(POPUP_SHOW_DURATION, complete);
		
		keyboardShortcutsEnabled = true;
		keyboardEscapeEnterEnabled = false;
		
		document.body.addEventListener('touchmove', prevent, false);
		mask.unbind("onButtonClick");
		if (escapeKeyHandler) $(document).unbind("onEscapeKey");
		if (enterKeyHandler) $(document).unbind("onEnterKey");
	}
	
	this.setEscapeKeyHandler = function(hnd) { escapeKeyHandler = hnd; }
	this.setEnterKeyHandler = function(hnd) { enterKeyHandler = hnd; }
}