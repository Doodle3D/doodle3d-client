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
		console.log("getSavedSketchStatus failed: ", response);
	});
}

function setSketchModified(_isModified, doNotClearCurrent) {
	isModified = _isModified;

	// alert("isModified: " + isModified);
	//console.log("setModified: " + isModified + (typeof(doNotClearCurrent) !== 'undefined' ? " (doNotClearCurrent: "+doNotClearCurrent+")" : "")); //TEMP

	if (isModified) enableButton(btnSave, saveSketch);
	else disableButton(btnSave);

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
	enableButton(btnPrevious, prevDoodle);
	disableButton(btnNext);
	currentSketchId = numSavedSketches+1; //after the end of the list
	disableButton(btnSave);
}

function updatePrevNextButtonState() {

	//btnPrevious state
	if (numSavedSketches==0 || currentSketchId < 2) {
		disableButton(btnPrevious);
	} else {
		enableButton(btnPrevious, prevDoodle);
	}

	//btnNext state
	if (numSavedSketches==0 || currentSketchId >= numSavedSketches) {
		disableButton(btnNext);
	} else {
		enableButton(btnNext, nextDoodle);
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

//btnSave.mouseup(saveSketch);
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
