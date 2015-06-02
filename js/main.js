/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var debugMode = false;              // debug mode
var sendPrintCommands = true;       // if Doodle3d should send print commands to the 3d printer
var communicateWithWifibox = true;  // if Doodle3d should try interfacing with the wifibox (in case one is not connected)
var wifiboxIsRemote = false;        // when you want to run the client on a computer and have it remotely connect to the wifibox
var autoUpdate = true; 							// auto retrieve updates about temperature and progress from printer
var autoLoadSketchId;

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
var limitedFeatures = false;

var clientInfo = {};

var POPUP_SHOW_DURATION = 175;
var BUTTON_GROUP_SHOW_DURATION = 80;

$(function() {
  console.log("ready");
  
  if (getURLParameter("d") != "null") debugMode = (getURLParameter("d") == "1");
  if (getURLParameter("p") != "null") sendPrintCommands = (getURLParameter("p") == "1");
  if (getURLParameter("c") != "null") communicateWithWifibox = (getURLParameter("c") == "1");
  if (getURLParameter("r") != "null") wifiboxIsRemote = (getURLParameter("r") == "1");
  if (getURLParameter("u") != "null") autoUpdate = (getURLParameter("u") == "1");
  if (getURLParameter("l") != "null") limitedFeatures = (getURLParameter("l") == "1");
  if (getURLParameter("load") != "null") autoLoadSketchId = parseInt(getURLParameter("load"));

  var hostname;
  if (wifiboxIsRemote) hostname = 'http://192.168.5.1';
  if (getURLParameter("wifiboxURL") != "null") hostname = getURLParameter("wifiboxURL");
  
  if (location.host=='doodle3d') hostname = 'http://wifibox';
  if (!hostname) hostname = "http://" + window.location.host;

  wifiboxURL = hostname+"/d3dapi";
  wifiboxCGIBinURL = hostname+"/cgi-bin/d3dapi";


  if (!communicateWithWifibox) {
    sendPrintCommands = false; // 'communicateWithWifibox = false' implies this
  }
  console.log("debugMode: " + debugMode);
  console.log("sendPrintCommands: " + sendPrintCommands);
  console.log("communicateWithWifibox: " + communicateWithWifibox);
  console.log("wifiboxIsRemote: " + wifiboxIsRemote);
  console.log("wifibox URL: " + wifiboxURL);

  // rudimentary client info
  clientInfo.isMobileDevice = isMobileDevice();
  clientInfo.isSmartphone = isSmartphone();

  initDoodleDrawing();
  initPreviewRendering();
  initLayouting();
  // initSidebars();
  initButtonBehavior();
  initKeyboard();
  // initVerticalShapes();
  initWordArt();
  initShapeDialog();
  initScanDialog();

  disableDragging();
  
  if (!clientInfo.isSmartphone) initHelp();

	thermometer.init($("#thermometerCanvas"), $("#thermometerContainer"));
  progressbar.init($("#progressbarCanvas"), $("#progressbarCanvasContainer"));

  message.init($("#message"));

  printer.init();
	$(document).on(Printer.UPDATE,update);

	settingsWindow.init(wifiboxURL,wifiboxCGIBinURL);
	$(document).on(SettingsWindow.SETTINGS_LOADED, settingsLoaded);
	
  if(debugMode) {
    console.log("debug mode is true");
    $("body").css("overflow", "auto");
    $("#debug_textArea").css("display", "block");
    //$("#preview_tmp").css("display", "block");
    $("#debug_display").css("display", "block");
  }

  if (limitedFeatures) {
    initLimitedInterface();
  }
});

function disableDragging() {
  $(document).bind("dragstart", function(event) {
    console.log("dragstart");
    event.preventDefault();
  });
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
	
	if(firstTimeSettingsLoaded) {
		console.log("  preheat: ",settings["printer.heatup.enabled"]);
		console.log("  state: ",state);
		if(state == Printer.IDLE_STATE && settings["printer.heatup.enabled"]) {
			printer.preheat();
		}
		console.log("doodle3d.tour.enabled: ",settings["doodle3d.tour.enabled"]);
		if(settings["doodle3d.tour.enabled"] && !clientInfo.isSmartphone) {
			console.log("show tour");
			initHelp();
		}
		firstTimeSettingsLoaded = false;
	}
	
}

function setDebugText(text) {
	$("#debug_display").text(text);
  
}
