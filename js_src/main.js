var debugMode = false;              // debug mode
var sendPrintCommands = true;       // if Doodle3d should send print commands to the 3d printer
var communicateWithWifibox = true;  // if Doodle3d should try interfacing with the wifibox (in case one is not connected)
var wifiboxIsRemote = false;        // when you want to run the client on a computer and have it remotely connect to the wifibox
var autoUpdate = true; 							// auto retrieve updates about temperature and progress from printer

var printer =  new Printer();
var progressbar = new Progressbar();
var thermometer = new Thermometer();
var settingsWindow = new SettingsWindow();
var message = new Message();

var firstTimeSettingsLoaded = true;

var wifiboxURL; // Using the uhttpd lua handler as default, because of better performance
var wifiboxCGIBinURL; // CGI-bin, for some network stuff, where it needs to restart the webserver for example

var $drawAreaContainer, $doodleCanvas, doodleCanvas, doodleCanvasContext, $previewContainer;

var showhideInterval;
var showOrHide = false;

var numSavedSketches = -1;
var currentSketchId = -1;
var isModified = false;

$(function() {
  console.log("ready");


  //TODO give this a more logical place in code

  if (getURLParameter("d") != "null") debugMode = (getURLParameter("d") == "1");
  if (getURLParameter("p") != "null") sendPrintCommands = (getURLParameter("p") == "1");
  if (getURLParameter("c") != "null") communicateWithWifibox = (getURLParameter("c") == "1");
  if (getURLParameter("r") != "null") wifiboxIsRemote = (getURLParameter("r") == "1");
  if (getURLParameter("u") != "null") autoUpdate = (getURLParameter("u") == "1");

	if (wifiboxIsRemote) {
		wifiboxURL = "http://192.168.5.1/d3dapi";
		wifiboxCGIBinURL = "http://192.168.5.1/cgi-bin/d3dapi";
	} else {
		wifiboxURL = "http://" + window.location.host + "/d3dapi";
		wifiboxCGIBinURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
	}

  if (!communicateWithWifibox) {
    sendPrintCommands = false; // 'communicateWithWifibox = false' implies this
  }
  console.log("debugMode: " + debugMode);
  console.log("sendPrintCommands: " + sendPrintCommands);
  console.log("communicateWithWifibox: " + communicateWithWifibox);
  console.log("wifiboxIsRemote: " + wifiboxIsRemote);
  console.log("wifibox URL: " + wifiboxURL);

  initDoodleDrawing();
  initPreviewRendering();
  initLayouting();
  initSidebars();
  initButtonBehavior();
  initVerticalShapes();

	thermometer.init($("#thermometerCanvas"), $("#thermometerContainer"));
  progressbar.init($("#progressbarCanvas"), $("#progressbarCanvasContainer"));

  message.init($("#message"));

  printer.init();
	$(document).on(Printer.UPDATE,update);

	settingsWindow.init(wifiboxURL,wifiboxCGIBinURL);
	$(document).on(SettingsWindow.SETTINGS_LOADED, settingsLoaded);

	getSavedSketchStatus();
	setSketchModified(false);

  if(debugMode) {
    console.log("debug mode is true");
    $("body").css("overflow", "auto");
    $("#debug_textArea").css("display", "block");
    $("#preview_tmp").css("display", "block");

    $("#debug_display").css("display", "block");

    // show and hide the progressguage and thermometer
    //showhideInterval = setInterval(showOrHideThermo, 2500);

//    $("#debugContainer").css("display", "block");

    /* TEMP CODE!! -> artificially populates the startgcode and endgcode textareas in the settings window */
    // todo remove this temporary code...
    /*
    setTimeout(function() {
      $("#startgcode").text("");
      $("#startgcode").append("G21 (mm) \n");
      $("#startgcode").append("G91 (relative) \n");
      $("#startgcode").append("G28 X0 Y0 Z0 (physical home) \n");
      $("#startgcode").append("M104 S230 (temperature) \n");
      $("#startgcode").append("G1 E10 F250 (flow) \n");
      $("#startgcode").append("G92 X-100 Y-100 Z0 E10 \n");
      $("#startgcode").append("G1 Z3 F5000 (prevent diagonal line) \n");
      $("#startgcode").append("G90 (absolute) \n");
      $("#startgcode").append("M106 (fan on)");
      console.log("$('#startgcode'): " + $("#startgcode").val());

      $("#endgcode").text("");
      $("#endgcode").append("G1 X-100 Y-100 F15000 (fast homing) \n");
      $("#endgcode").append("M107 \n");
      $("#endgcode").append("M84 (disable axes) \n");
      console.log("$('#endgcode'): " + $("#endgcode").val());
    }, 1000);
    //*/
  }
});

function enableButton(domId, handler) {
	var elem = $(domId)
	elem.removeClass("disabled");
	elem.unbind('touchstart mousedown');
	elem.bind('touchstart mousedown', handler);
}

function disableButton(domId) {
	var elem = $(domId)
	elem.addClass("disabled");
	elem.unbind('touchstart mousedown');
}

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
			}
		}
	}).fail(function() {
		console.log("getSavedSketchStatus failed: ", response);
	});
}

function setSketchModified(isModified, doNotClearCurrent) {
	console.log("setModified: " + isModified + (typeof(doNotClearCurrent) !== 'undefined' ? " (doNotClearCurrent: "+doNotClearCurrent+")" : "")); //TEMP

	if (isModified) { enableButton(btnSave, saveSketch); }
	else { disableButton(btnSave); }

	if (typeof(doNotClearCurrent) !== 'undefined' && !doNotClearCurrent) setCurrentSketchId(-1);
	sketchModified  = isModified;
}

function setCurrentSketchId(sId) {
	console.log("setCurrentSketchId: " + sId + " / " + numberOfSketches);
	var enablePrev = false, enableNext = false;
	if (numberOfSketches == 0) {
		/* variables are initialized to false, so nothing to be done here */
	} else if (numberOfSketches > 0) {
		//if we are not at a saved sketch, consider all saved sketches as 'previous' ones
		enablePrev = currentSketchId > 1 || currentSketchId == -1;
		enableNext = currentSketchId < numberOfSketches;
	}

	if (enablePrev) { enableButton(btnPrevious, prevDoodle); }
	else { disableButton(btnPrevious); }

	if (enableNext) { enableButton(btnNext, nextDoodle); }
	else { disableButton(btnNext); }

}

function showOrHideThermo() {
  console.log("f:showOrHideThermo()");
  if (showOrHide) {
    thermometer.hide();
    progressbar.hide();
  } else {
    thermometer.show();
    progressbar.show();

  }
  showOrHide = !showOrHide;
}

function settingsLoaded() {
	console.log("settingsLoaded");
	console.log("autoHeatup: ",settings["printer.heatup.enabled"]);
	if(settings["printer.heatup.enabled"]) {
		if(firstTimeSettingsLoaded) {
			printer.preheat();
			firstTimeSettingsLoaded = false;
		}
	}
}

function setDebugText(text) {
	$("#debug_display").text(text);
}
