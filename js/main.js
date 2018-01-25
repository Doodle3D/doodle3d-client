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

var clientInfo = {};

var POPUP_SHOW_DURATION = 175;
var BUTTON_GROUP_SHOW_DURATION = 80;

var settings = {
  "doodle3d.simplify.minDistance": 3,
  "doodle3d.tour.enabled": true,
  "doodle3d.update.baseUrl": "http://doodle3d.com/updates",
  "doodle3d.update.includeBetas": false,
  "gcode.server": "http://gcodeserver.doodle3d.com",
  "network.ap.address" : "192.168.10.1",
  "network.ap.key" : "",
  "network.ap.netmask" : "255.255.255.0", 
  "network.ap.ssid" : "Doodle3D-%%MAC_ADDR_TAIL%%",
  "network.cl.wifiboxid": "Doodle3D-%%MAC_ADDR_TAIL%%",
  "printer.baudrate": "115200",
  "printer.bed.temperature": 50,
  "printer.bottomEnableTraveling": true,
  "printer.bottomFlowRate": 2,
  "printer.bottomLayerSpeed": 35,
  "printer.dimensions.x" : 120,
  "printer.dimensions.y": 120,
  "printer.dimensions.z": 120,
  "printer.enableTraveling": true,
  "printer.startcode": "M104 S220\nG21\nM107\nG28 X0 Y0 Z0\nM109 S220\nG28 Z0\nG1 Z15 F9000\nG92 E0\nG91\nG1 F200 E20\nG92 E0\nG92 E0\nG1 F9000\nG90\n",
  "printer.endcode": "M107\nG91\nG1 E-1 F300\nG1 Z+0.5 E-5 X-20 Y-20 F9000\nG28 X0 Y0",
  "printer.filamentThickness": 1.75,
  "printer.firstLayerSlow": true,
  "printer.heatedbed": false,
  "printer.heatup.bed.temperature": 0,
  "printer.heatup.enabled": false,
  "printer.heatup.temperature": 0,
  "printer.layerHeight": 0.2,
  "printer.retraction.amount": 3,
  "printer.retraction.enabled": true,
  "printer.retraction.minDistance": 5,
  "printer.retraction.speed": 50,
  "printer.screenToMillimeterScale": .3,
  "printer.speed": 70,
  "printer.temperature": 180,
  "printer.travelSpeed": 200,
  "printer.type:": "marlin_generic",
  "printer.useSubLayers": true,
  "printer.wallThickness": 0.5,
  "system.log.level": "info"
  // "M104 S{printingTemp}\n{if heatedBed}M190 S{printingBedTemp}\nG21\nM107\nG28 X0 Y0\nM109 S{printingTemp}\nG28 Z0\nG1 Z15 F9000\nG92 E0\nG91\nG1 F200 E10\nG92 E0\nG92 E0\nG1 F9000\nG90\n"
  //
};


$(function() {
  console.log("Doodle3D client ready");
  console.log("Build information - <%= build_info %>)");
  
  if (getURLParameter("d") != "null") debugMode = (getURLParameter("d") == "1");
  if (getURLParameter("p") != "null") sendPrintCommands = (getURLParameter("p") == "1");
  if (getURLParameter("c") != "null") communicateWithWifibox = (getURLParameter("c") == "1");
  if (getURLParameter("r") != "null") wifiboxIsRemote = (getURLParameter("r") == "1");
  if (getURLParameter("u") != "null") autoUpdate = (getURLParameter("u") == "1");

  var hostname;
  if (wifiboxIsRemote) hostname = 'http://192.168.5.1';
  if (getURLParameter("wifiboxURL") != "null") hostname = getURLParameter("wifiboxURL");
  if (!hostname) hostname = "http://" + window.location.host;

  wifiboxURL = hostname+"/d3dapi";
  wifiboxCGIBinURL = hostname+"/cgi-bin/d3dapi";



  // setInterval(function() {
  //   $.get("/inquiry",function(data) {
  //     console.log(data);
  //   })
  // },2000);



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

// function settingsLoaded() {
// 	console.log("settingsLoaded");
	
// 	if(firstTimeSettingsLoaded) {
// 		console.log("  preheat: ",settings["printer.heatup.enabled"]);
// 		console.log("  state: ",state);
// 		if(state == Printer.IDLE_STATE && settings["printer.heatup.enabled"]) {
// 			printer.preheat();
// 		}
// 		console.log("doodle3d.tour.enabled: ",settings["doodle3d.tour.enabled"]);
// 		if(settings["doodle3d.tour.enabled"] && !clientInfo.isSmartphone) {
// 			console.log("show tour");
// 			initHelp();
// 		}
// 		firstTimeSettingsLoaded = false;
// 	}
	
// }

function setDebugText(text) {
	$("#debug_display").text(text);
}
