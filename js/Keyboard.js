var keyboardShortcutsEnabled = true;
var keyboardEscapeEnterEnabled = false;
var wordBuffer = "";

var wordFuncs = {
		"idbeholdl": function() {
			alert("Light!");
		},
		"idspispopd": function() {
			drawTextOnCanvas("Im in ur kanvas drawin' ur stuffz.");
		},
		"dia": function() {
			var cx = canvasWidth / 2;
			var cy = canvasHeight /2;
			drawCircle(cx, cy, 50, 4);
			shapeMoveTo(cx - 20, cy);
			shapeLineTo(cx + 20, cy);
			shapeMoveTo(cx, cy - 20);
			shapeLineTo(cx, cy + 20);
		},
		"stats": function() {
			var text = "Shape statistics:\nNumber of points: " + _points.length;
			alert(text);
		},
		"pdump": function() {
			console.log("points array: " + _points);
		}
};

function initKeyboard() {

	$(document).keypress(function(event) {

		if (keyboardEscapeEnterEnabled) {
			switch (event.keyCode) {
			case 13:
				$(document).trigger("onEnterKey");
				break;
			case 27:
				$(document).trigger("onEscapeKey");
				break;
			}
		}

		if (!keyboardShortcutsEnabled) return;
		if (event.ctrlKey && event.altKey && ! event.metaKey) processWords(event);
		if (event.altKey || event.ctrlKey || event.metaKey) return; //ignore key presses with modifier keys except shift

		var ch = String.fromCharCode(event.which);

		switch (ch) {
			case '+': case '=': zoomShape(1.05); break;
			case ',': openSettingsWindow(); break;
			case '-': zoomShape(.95); break;
			case ';': moveShape(-5,0); break;
			case '[': previewTwistLeft(); break;
			case '\'': moveShape(5,0); break;
			case ']': previewTwistRight(); break;
			case 'c': newSketch(); break;
			case 'f': showTravelLines=!showTravelLines; redrawDoodle(); break;
			case 'g': settingsWindow.downloadGcode(); break;
			case 'H': previewDown(true); break;
			case 'h': previewUp(true); break;
			case 'i': showShapeDialog(); break;
			case 'L': nextSketch(); break;
			case 'l': prevSketch(); break;
			case 'n': newSketch(); break;
			case 'p': print(); break;
			case 'q': stopPrint(); break;
			case 'R': rotateShape(-.1); break;
			case 'r': rotateShape(.1); break;
			case 's': saveSketch(); break;
			case 'T': showScanDialog(); break;
			case 't': showWordArtDialog(); break;
			case 'u': oopsUndo(); break;
			case '|': resetTwist(); break;
			
			//default: console.log("Key: '" + ch + "' (" + event.which + ")");
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
