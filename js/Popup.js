function Popup(element, mask) {
	var autoCloseEnabled = true;
	var enterEnabled = true;
	var self = this;
	
	this.open = function(complete, disableMaskClick) {
		mask.fadeIn(POPUP_SHOW_DURATION);
		element.fadeIn(POPUP_SHOW_DURATION, complete);
		
		keyboardShortcutsEnabled = false;
		keyboardEscapeEnterEnabled = true;
		
		document.body.removeEventListener('touchmove', prevent, false);
		mask.bind("onButtonClick", self.cancel);
		$(document).bind("onEscapeKey", self.cancel);
		if (enterEnabled) $(document).bind("onEnterKey", self.commit);
	}
	
	this.close = function(complete) {
		mask.fadeOut(POPUP_SHOW_DURATION);
		element.fadeOut(POPUP_SHOW_DURATION, complete);
		
		keyboardShortcutsEnabled = true;
		keyboardEscapeEnterEnabled = false;
		
		document.body.addEventListener('touchmove', prevent, false);
		mask.unbind("onButtonClick", self.cancel);
		$(document).unbind("onEscapeKey", self.cancel);
		if (enterEnabled) $(document).unbind("onEnterKey", self.commit);
	}
	
	this.setEnterEnabled = function(enabled) { enterEnabled = enabled; }
	
	this.setAutoCloseEnabled = function(enabled) { autoCloseEnabled = enabled; }
	
	this.cancel = function() {
		$(element).trigger('onPopupCancel');
		if (autoCloseEnabled) self.close();
	}
	
	this.commit = function() {
		$(element).trigger('onPopupCommit');
		if (autoCloseEnabled) self.close();
	}
}