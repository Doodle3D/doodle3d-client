/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var curSketch = 0;
var sketches = []; //contains fileIDs
var sketchLoaded = false;

function previousSketch(e) {
	loadSketch(curSketch-1);	
}

function nextSketch(e) {
	loadSketch(curSketch+1);
}

function newSketch(e) {
	clearDoodle();
	curSketch = sketches.length; //index of the last item + 1
	updateSketchButtonStates();
}

function listSketches() {
	console.log('listSketches')
	$.get(wifiboxURL + "/sketch/list", function(data) {
		if (data.status=='success') {
			sketches = data.data.list;
			curSketch = sketches.length-1;
			setSketchModified(false);
			updateSketchButtonStates();

			if (autoLoadSketchId) loadSketch(autoLoadSketchId);
		}
	})
}

function setSketchModified(_isModified) {
	isModified = _isModified;
	updateSketchButtonStates();
}

function updateSketchButtonStates() {
	console.log('sketch: isModified',isModified,'curSketch',curSketch,'sketches.length',sketches.length);

	if (isModified) {
		btnSave.enable();
	}
	else {
		btnSave.disable();
	}

	if (curSketch<sketches.length-1) {
		btnNext.enable();
	} else {
		btnNext.disable();
	}

	if (curSketch>0) {
		btnPrevious.enable();
	} else {
		btnPrevious.disable();
	}

}

function loadSketch(_curSketch) {
	curSketch = _curSketch;

	if (curSketch<0) curSketch=0;
	if (curSketch>sketches.length-1) curSketch=sketches.length-1;

	var id = sketches[curSketch];

	console.log('sketch: loadSketch curSketch',curSketch,'id',id);

	$.get(wifiboxURL + "/sketch", {id:id}, function(response) {
		if (response.status=='success') {
			console.log('sketch: loaded',response);
			var svgData = response.data.data;
			loadFromSvg(svgData);
			setSketchModified(false);
			sketchLoaded = true;
		} else {
			console.log('error loading sketch: ',response);
			listSketches();
		}
		
	})
}

function saveSketch() {
	console.log("sketch: saveSketch");
	var svgData = saveToSvg();

	$.post(wifiboxURL + "/sketch", {data: svgData}, function(response) {
		console.log("sketch: saveSketch: response",response);
		listSketches();
	})

}
