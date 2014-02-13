/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var currentSketchId = 0;
var numSavedSketches = 0;

function getSavedSketchStatus() {
	$.ajax({
		url: wifiboxURL + "/sketch/status",
		dataType: 'json',
		type: 'GET',
		//timeout: this.timeoutTime,
		success: function(response) {
			if (response.status == 'error' || response.status == 'fail') {
				console.log("getSavedSketchStatus fail/error: " + response.msg + " -- ", response);
			} else {
				console.log("getSavedSketchStatus success: num. saved: " + response.data.number_of_sketches + ", space available: " + response.data.available);
				numSavedSketches = response.data.number_of_sketches;
				updatePrevNextButtonStateOnClear();
			}
		}
	}).fail(function() {
		console.log("getSavedSketchStatus failed");
	});
}

function setSketchModified(_isModified, doNotClearCurrent) {
	isModified = _isModified;

	// alert("isModified: " + isModified);
	//console.log("setModified: " + isModified + (typeof(doNotClearCurrent) !== 'undefined' ? " (doNotClearCurrent: "+doNotClearCurrent+")" : "")); //TEMP

	if (isModified) btnSave.enable();
	else btnSave.disable();

	//if (typeof(doNotClearCurrent) !== 'undefined' && !doNotClearCurrent) setCurrentSketchId(-1);

	
	//sketchModified  = isModified; /// ERROR?
}

function setCurrentSketchId(sId) {
	console.log("setCurrentSketchId: " + sId + " / " + numSavedSketches);
	// var enablePrev = false;
	// var enableNext = false;

	currentSketchId = sId;

	//clamp
	if (currentSketchId > numSavedSketches) currentSketchId = numSavedSketches;
	if (currentSketchId < 1) currentSketchId = 1;

	//update textbox
	//$("#txtSketch").val(currentSketchId);
	
	updatePrevNextButtonState();
}

function updatePrevNextButtonStateOnClear() {
	if (numSavedSketches > 0) btnPrevious.enable();
	btnNext.disable();
	currentSketchId = numSavedSketches+1; //after the end of the list
	btnSave.disable();
}

function updatePrevNextButtonState() {

	//btnPrevious state
	if (numSavedSketches==0 || currentSketchId < 2) {
		btnPrevious.disable();
	} else {
		btnPrevious.enable();
	}

	//btnNext state
	if (numSavedSketches==0 || currentSketchId >= numSavedSketches) {
		btnNext.disable();
	} else {
		btnNext.enable();
	}
}

function loadSketch(sketchId) {

	$.ajax({
		url: wifiboxURL + "/sketch/" + sketchId,
		dataType: 'json',
		type: 'GET',
//			timeout: this.timeoutTime,
		success: function(response) {
			if (response.status == 'error' || response.status == 'fail') {
				console.log("loadSketch fail/error: " + response.msg + " -- ", response);
			} else {
				console.log("loadSketch success: loaded id #" + response.data.id, response);
				//console.log("sketch content:\n" + response.data.data);
				if (loadFromSvg(response.data.data)) {
					setSketchModified(false, true);
					setCurrentSketchId(response.data.id);
				}
			}
		}
	}).fail(function() {
		console.log("loadSketch failed: ", response);
	});
}

function saveSketch() {
	svg = saveToSvg();
	console.log("generated SVG [" + _points.length + " points, " + svg.length + " bytes]:\n" + svg);

	$.ajax({
		url: wifiboxURL + "/sketch",
		dataType: 'json',
		type: 'POST',
		data: { data: svg },
		//timeout: this.timeoutTime,
		success: function(response) {
			if (response.status == 'error' || response.status == 'fail') {
				console.log("saveSketch fail/error: " + response.msg + " -- ", response);
			} else {
				console.log("saveSketch success: saved with id #" + response.data.id, response);
				setSketchModified(false, true);
				numSavedSketches = response.data.id;
				setCurrentSketchId(response.data.id);
			}
		}
	}).fail(function() {
		console.log("saveSketch failed: ", response);
	});
}

function prevDoodle(e) {
  console.log("f:prevDoodle(): " + currentSketchId + " / " + numSavedSketches);
  //alert('prev ' + numSavedSketches);
  //return;

  //TODO: if (enabled) {
	  var sketchId = (currentSketchId > 0) ? currentSketchId : numSavedSketches;
	  if (sketchId > 1) sketchId--;


	  //alert(sketchId);

	  loadSketch(sketchId);
  //}
}

function nextDoodle(e) {
  console.log("f:nextDoodle()");
  //alert('next ' + numSavedSketches);
  //return;

  //TODO: if (enabled) {
	  var sketchId = (currentSketchId > 0) ? currentSketchId : numSavedSketches;
	  if (sketchId < numSavedSketches) sketchId++;
	  loadSketch(sketchId);
  //}
}
