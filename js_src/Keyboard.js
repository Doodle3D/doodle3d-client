/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var keyboardShortcutsEnabled = true;

function initKeyboard() {

	$(document).keypress(function(event) {

		if (!keyboardShortcutsEnabled) return;

		var ch = String.fromCharCode(event.which);

		switch (ch) {
			case 'c': clearDoodle(); break;
			case 'n': clearDoodle(); break;
			case 'p': print(); break;
			case 'u': oopsUndo(); break;
			case 'e': settingsWindow.downloadGcode(); break;
			case 'q': stopPrint(); break;
			case ',': openSettingsWindow(); break;
			case 'C': drawCircle(250,180,80,64); break; //x,y,r,res 
			case 'T': drawCircle(250,180,80,3); break; //triangle
			case 'X': drawCircle(250,180,80,6); break; //hexagon
			case 'h': previewUp(true); break;
			case 'H': previewDown(true); break;
			case 's': saveSketch(); break;
			case 'L': nextDoodle(); break;
			case 'l': prevDoodle(); break;
			case '[': previewTwistLeft(); break;
			case ']': previewTwistRight(); break;
			case '\'': resetTwist(); break;
			default: console.log("Key: '" + ch + "' (" + event.which + ")");
		}
	})

}
