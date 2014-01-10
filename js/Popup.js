function showPopup(popup) {
  $("#popupMask").fadeIn(POPUP_SHOW_DURATION);
  popup.fadeIn(POPUP_SHOW_DURATION);
  keyboardShortcutsEnabled=false;
}

function hidePopup(popup) {
	$("#popupMask").fadeOut(POPUP_SHOW_DURATION);
  popup.fadeOut(POPUP_SHOW_DURATION);
  keyboardShortcutsEnabled=true;	
}