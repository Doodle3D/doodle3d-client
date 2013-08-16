var wifiboxURL;//"http://192.168.5.1/cgi-bin/d3dapi";

//these settings are defined in the firmware (conf_defaults.lua) and will be initialized in loadSettings()
var settings = {
"network.ap.ssid": "d3d-ap-%%MAC_ADDR_TAIL%%",
"network.ap.address": "192.168.10.1",
"network.ap.netmask": "255.255.255.0",
"printer.temperature": 220,
"printer.objectHeight": '???',
"printer.layerHeight": 0.2,
"printer.wallThickness": 0.7,
"printer.speed": 50,
"printer.travelSpeed": 200,
"printer.filamentThickness": 2.85,
"printer.useSubLayers": true,
"printer.firstLayerSlow": true,
"printer.autoWarmUp": true,
"printer.simplify.iterations": 10,
"printer.simplify.minNumPoints": 15,
"printer.simplify.minDistance": 3,
"printer.retraction.enabled": true,
"printer.retraction.speed": 250,
"printer.retraction.minDistance": 1,
"printer.retraction.amount": 2,
"printer.autoWarmUpCommand": "M104 S220 (hardcoded temperature)" 
}

var settingsForm = $("#settingsForm");
settingsForm.submit(function(e) {
  e.preventDefault();
  saveSettings();
  return false;
})

function initSettingsPopup(apiURL) {
  console.log("f:initSettingsPopup()");
  wifiboxURL = apiURL;

  if (communicateWithWifibox) loadSettings();

  $("#contentOverlay").hide();

  $("div.content .btnOK").click(function(e) {
    e.preventDefault();
    e.stopPropagation();

    // TODO something like a callback or feedback that saving went well / or failed

    if (communicateWithWifibox) saveSettings();

    $("#contentOverlay").fadeOut(375, function() {
      document.body.addEventListener('touchmove',prevent,false);
    });

    console.log("button OK in settings popup pressed");
  });
}

function showSettings() {
  console.log("f:showSettings()");
  if (!communicateWithWifibox) console.log("     communicateWithWifibox is false: settings aren't being loaded from wifibox...")
  $("#contentOverlay").fadeIn(375, function() {
    console.log("#contentOverlay faded in...");
    if (communicateWithWifibox) loadSettings();
    document.body.removeEventListener('touchmove',prevent,false);
  });
}

function loadSettings() {
  console.log("f:loadSettings() >> getting new data...");
  $.get(wifiboxURL + "/config/all", {}, function(data) {
    settings = JSON.parse(data).data;
    
//    //        var printer_layerHeight = settings["printer.layerHeight"];
//    //        var printer_autoWarmup = settings["printer.autoWarmUp"];
//    console.log("print_layerHeight = " + settings["printer.layerHeight"]);
//    console.log("printer_autoWarmup = " + settings["printer.autoWarmUp"] + ", type: " + (typeof settings["printer.autoWarmUp"]));
//    console.log("printer_useSubLayers = " + settings["printer.useSubLayers"] + " type: " + (typeof settings["printer.useSubLayers"]));
//    $("#formpje input[name='printer.layerHeight']").attr('value', settings["printer.layerHeight"]);

    
    //update html with loaded wifi settings
    $("#ipaddress").attr('value', settings["network.ap.address"]);
    $("#netmask").attr('value', settings["network.ap.netmask"]);
    $("#ssid").attr('value', settings["network.ap.ssid"]);

    //update html with loaded printer settings
  
	$("#printersettings input").each( function(index,element) {
		var element = $(element);
		//console.log("printer setting input: ",index,element.attr("type"),element.attr('name')); //,element);
		if(element.attr("type") == "text") {
			element.val(settings[element.attr('name')]);
		} else if(element.attr("type") == "checkbox") {
			element.prop('checked', settings[element.attr('name')]);
		}
			
		//console.log("  val: ",$(element).val(),element);
		
	});
  });
}

function saveSettings(callback) {
  console.log("settings form submitted");
//  console.log("   printer.layerHeight:" + $("#formpje input[name='printer.layerHeight']").attr('value'));
//  console.log("   first layer slow (checkbox):" + $('#firstLayerSlow').prop('checked'));
//  console.log("   use sublayers (checkbox):" + $('#useSubLayers').prop('checked'));
  
  //var printerSettings = {};
  $("#printersettings input").each( function(index,element) {
	var element = $(element);
	//populate settings are with values from html
	if(element.attr("type") == "text") {
		settings[element.attr('name')] = element.val();
	} else if(element.attr("type") == "checkbox") {
		settings[element.attr('name')] = element.prop('checked')
	}
  });
  
  $.post(
    wifiboxURL + "/config",
    settings,
    function(data) {
      var res = JSON.parse(data).data;
      $.each(res, function(index, val) {
        if (val != "ok") {
          console.log("ERROR: value '" + index + "' not successfully set. Message: " + val);
        }
      });
      if (callback != undefined) {
        callback();
      }
    }
  );
}



/*************************
 *
 *
 *  FROM DOODLE3D.INI
 *
 */
//TODO: find all references to these variables, replace them and finally remove these.
var objectHeight = 20;
var layerHeight = .2;
//var wallThickness = .5;
var hop = 0;
//var speed = 70;
//var travelSpeed = 200;
var enableTraveling = true;
//var filamentThickness = 2.89;
var minScale = .3;
var maxScale = 1;
var shape = "%";
var twists = 0;
var useSubLayers = true;
//var debug = false; // debug moved to main.js
var loglevel = 2;
var zOffset = 0;
var serverport = 8888;
var autoLoadImage = "hand.txt";
var loadOffset = [0, 0]; // x en y ?
var showWarmUp = true;
var loopAlways = false;
var firstLayerSlow = true;
var useSubpathColors = false;
var autoWarmUp = true;
var maxObjectHeight = 150;
var maxScaleDifference = .1;
var frameRate = 60;
var quitOnEscape = true;
var screenToMillimeterScale = .3; // 0.3
var targetTemperature = 230;
var simplifyiterations = 10;
var simplifyminNumPoints = 15;
var simplifyminDistance = 3;
var retractionspeed = 50;
var retractionminDistance = 5;
var retractionamount = 3;
var sideis3D = true;
var sidevisible = true;
var sidebounds = [900, 210, 131, 390];
var sideborder = [880, 169, 2, 471];
var windowbounds = [0, 0, 800, 500];
var windowcenter = true;
var windowfullscreen = false;
var autoWarmUpCommand = "M104 S230";
//var checkTemperatureInterval = 3;
var autoWarmUpDelay = 3;
