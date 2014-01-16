var keyboardShortcutsEnabled = true;
var wordBuffer = "";

var wordFuncs = {
		"idbeholdl": function() {
			alert("Light!");
		},
		"idspispopd": function() {
			drawTextOnCanvas("Im in ur kanvas drawin' ur stuffz.");
		}
};

function initKeyboard() {

	$(document).keypress(function(event) {

		if (!keyboardShortcutsEnabled) return;
		if (event.ctrlKey && event.altKey && ! event.metaKey) processWords(event);
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
		if(event.which != 13) { // don't prevent enter usage, it's used in tour
			event.preventDefault(); //prevents the character to end up in a focussed textfield
		}
	})

}

function processWords(e) {
	wordBuffer += String.fromCharCode(e.which);
	
	var match = false;
	for (var k in wordFuncs) {
		if (k.indexOf(wordBuffer) == 0) {
			if (k.length == wordBuffer.length) match = wordFuncs[k];
			else match = true;
			break;
		}
	}
	
	if (typeof(match) == 'function') {
		match();
		wordBuffer = "";
	} else if (!match) {
		wordBuffer = "";
	}
}
