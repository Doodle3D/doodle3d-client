function showPopup(popup) {
  $(".popupMask").show();
  popup.show();
  keyboardShortcutsEnabled=false;
}

function hidePopup(popup) {
	$(".popupMask").hide();
  popup.hide();
  keyboardShortcutsEnabled=true;	
}