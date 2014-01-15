var keyboardShortcutsEnabled = true;

function initKeyboard() {

	$(document).keypress(function(event) {

		if (!keyboardShortcutsEnabled) return;
		if (event.altKey || event.ctrlKey || event.metaKey) return; //ignore key presses with modifier keys except shift

		var ch = String.fromCharCode(event.which);

		switch (ch) {
			case 'c': clearDoodle(); break;
			case 'n': clearDoodle(); break;
			case 'p': print(); break;
			case 'u': oopsUndo(); break;
			case 'g': settingsWindow.downloadGcode(); break;
			case 'q': stopPrint(); break;
			case ',': openSettingsWindow(); break;
			case 'h': previewUp(true); break;
			case 'H': previewDown(true); break;
			case 's': saveSketch(); break;
			case 'L': nextDoodle(); break;
			case 'l': prevDoodle(); break;
			case '[': previewTwistLeft(); break;
			case ']': previewTwistRight(); break;
			case '|': resetTwist(); break;
			case 't': showWordArtDialog(); break;
			case 'i': showShapeDialog(); break;
			
			case ';': moveShape(-5,0); break;
			case '\'': moveShape(5,0); break;
			case '-': zoomShape(.95); break;
			case '+': zoomShape(1.05); break;
			case 'r': rotateShape(.1); break;
			case 'R': rotateShape(-.1); break;
			
			default: console.log("Key: '" + ch + "' (" + event.which + ")");
		}
		event.preventDefault(); //prevents the character to end up in a focussed textfield
	})

}