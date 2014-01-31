var keyboardShortcutsEnabled = true;
var keyboardEscapeEnterEnabled = false;
var wordBuffer = "";
var charOffset = -1;

var wordFuncs = {
		"idbeholdl": function() { //a flashlight for when times get dark...
			alert("Light!");
		},
		"idspispopd": function() { //I live!
			drawTextOnCanvas("Im in ur kanvas drawin' ur stuffz.");
		},
		"dia": function() { //draw a diamond with a cross onto the sketch shape for calibration purposes
			var cx = canvasWidth / 2;
			var cy = canvasHeight /2;
			drawCircle(cx, cy, 50, 4);
			shapeMoveTo(cx - 20, cy);
			shapeLineTo(cx + 20, cy);
			shapeMoveTo(cx, cy - 20);
			shapeLineTo(cx, cy + 20);
		},
		"btest": function() { //brim test (in conjunction with)
			var cx = canvasWidth / 2;
			var cy = canvasHeight /2;
			//for (var i = 45; i <= 51; i += 3) { drawCircle(cx, cy, i, 4); }
			var base = 75;
			drawCircle(cx, cy, base, 6);
			drawCircle(cx, cy, base -3, 6);
			drawCircle(cx, cy, base + 3, 6);
//			drawCircle(cx, cy, base + 9, 6);
//			drawCircle(cx, cy, base + 12, 6);
		},
		"stats": function() { //show statistics?
			var text = "Shape statistics:\nNumber of points: " + _points.length;
			alert(text);
		},
		"pdump": function() { //dump points array
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
			
			//default: console.log("Key: '" + ch + "' (" + event.which + ")");
		}
		if(event.which != 13) { // don't prevent enter usage, it's used in tour
			event.preventDefault(); //prevents the character to end up in a focussed textfield
		}
	})

}

function processWords(e) {
	//chrome fills e.which with an alphabetical index somehow, so we add a lowercase 'a'
	if (charOffset < 0) charOffset = window.chrome ? 96 : 0;
	wordBuffer += String.fromCharCode(charOffset + e.which);
	
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
