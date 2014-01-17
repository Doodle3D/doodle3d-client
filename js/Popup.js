function Popup(element, mask) {
	var self = this;
	
	this.open = function(complete, disableMaskClick) {
		mask.fadeIn(POPUP_SHOW_DURATION);
		element.fadeIn(POPUP_SHOW_DURATION, complete);
		
		keyboardShortcutsEnabled = false;
		keyboardEscapeEnterEnabled = true;
		
		document.body.removeEventListener('touchmove', prevent, false);
		mask.bind("onButtonClick", self.cancel);
		$(document).bind("onEscapeKey", self.cancel);
		$(document).bind("onEnterKey", self.commit);
	}
	
	this.close = function(complete) {
		mask.fadeOut(POPUP_SHOW_DURATION);
		element.fadeOut(POPUP_SHOW_DURATION, complete);
		
		keyboardShortcutsEnabled = true;
		keyboardEscapeEnterEnabled = false;
		
		document.body.addEventListener('touchmove', prevent, false);
		mask.unbind("onButtonClick", self.cancel);
		$(document).unbind("onEscapeKey", self.cancel);
		$(document).unbind("onEnterKey", self.commit);
	}
	
	this.cancel = function() {
		self.close();
		$(element).trigger('onPopupCancel');
	}
	
	this.commit = function() {
		self.close();
		$(element).trigger('onPopupCommit');
	}
}