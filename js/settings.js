var wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";

var settings = {
  layerHeight: 0.2,
  wallThickness: 0.6,
  filamentThickness: 2.89,
  speed: 50,
  travelSpeed: 200,
  autoWarmup: true,
  firstLayerSlow: true,
  useSubLayers: true,
  useRetraction: true,
  retractionAmount: 2,
  retractionMinDistance: 1,
  retractionSpeed: 250,
  networkIP: "192.168.10.1",
  networkNetmask: "255.255.255.0",
  networkSsid: "d3d-ap-%%MAC_ADDR_TAIL%%"
}

var settingsForm = $("#settingsForm");
settingsForm.submit(function(e) {
  e.preventDefault();
  saveSettings();
  return false;
})

function initSettingsPopup() {
  console.log("f:initSettingsPopup()");

  $("#contentOverlay").hide();

  $("div.content .btnOK").click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    // TODO something like a callback or feedback that saving went well / or failed
    saveSettings();

    $("#contentOverlay").fadeOut(375, function() {
      document.body.addEventListener('touchmove',prevent,false);
    });

    console.log("button OK in settings popup pressed");
  });
}

function showSettings() {
  console.log("f:showSettings()");
  $("#contentOverlay").fadeIn(375, function() {
    console.log("#contentOverlay faded in...");
    loadSettings();
    document.body.removeEventListener('touchmove',prevent,false);
  });
}

function loadSettings() {
  console.log("f:loadSettings() >> getting new data...");
  $.get(wifiboxURL + "/config/all", {}, function(data) {
//    console.log("f:loadSettings()");
    var settings = JSON.parse(data).data;
    //        var printer_layerHeight = settings["printer.layerHeight"];
    //        var printer_autoWarmup = settings["printer.autoWarmUp"];
    console.log("print_layerHeight = " + settings["printer.layerHeight"]);
    console.log("printer_autoWarmup = " + settings["printer.autoWarmUp"] + ", type: " + (typeof settings["printer.autoWarmUp"]));
    console.log("printer_useSubLayers = " + settings["printer.useSubLayers"] + " type: " + (typeof settings["printer.useSubLayers"]));
    $("#formpje input[name='printer.layerHeight']").attr('value', settings["printer.layerHeight"]);

    // printer settings
    $('#autoWarmUp').prop('checked', settings["printer.autoWarmUp"]);
    $('#firstLayerSlow').prop('checked', settings["printer.firstLayerSlow"]);
    $('#useSubLayers').prop('checked', settings["printer.useSubLayers"]);
    $("#layerHeight").attr('value', settings["printer.layerHeight"]);
    $("#wallThickness").attr('value', settings["printer.wallThickness"]);
    $("#filamentThickness").attr('value', settings["printer.filamentThickness"]);
    $("#speed").attr('value', settings["printer.speed"]);
    $("#travelSpeed").attr('value', settings["printer.travelSpeed"]);
    $("#retractionAmount").attr('value', settings["printer.retraction.amount"]);
    $("#retractionMinDistance").attr('value', settings["printer.retraction.minDistance"]);
    $("#retractionSpeed").attr('value', settings["printer.retraction.speed"]);

    // wifi settings
    $("#ipaddress").attr('value', settings["network.ap.address"]);
    $("#netmask").attr('value', settings["network.ap.netmask"]);
    $("#ssid").attr('value', settings["network.ap.ssid"]);
    //      network.ap.address: "192.168.10.1"
    //      network.ap.netmask: "255.255.255.0"
    //      network.ap.ssid: "d3d-ap-%%MAC_ADDR_TAIL%%"

  });
}

function saveSettings(callback) {
  console.log("settings form submitted");
  console.log("   printer.layerHeight:" + $("#formpje input[name='printer.layerHeight']").attr('value'));
  console.log("   first layer slow (checkbox):" + $('#firstLayerSlow').prop('checked'));
  console.log("   use sublayers (checkbox):" + $('#useSubLayers').prop('checked'));
  $.post(
    wifiboxURL + "/config",
    {
      "printer.autoWarmUp" : ($('#autoWarmUp').prop('checked') == true) ? 1 : 0,
      "printer.firstLayerSlow": ($('#firstLayerSlow').prop('checked') == true) ? 1 : 0,
      "printer.useSubLayers": ($('#useSubLayers').prop('checked') == true) ? true : false,
      //          "printer.useSubLayers": $('#useSubLayers').prop('checked'),
      "printer.layerHeight": $("#layerHeight").attr('value'),
      "printer.wallThickness": $("#wallThickness").attr('value'),
      "printer.filamentThickness": $("#filamentThickness").attr('value'),
      "printer.speed": $("#speed").attr('value'),
      "printer.travelSpeed": $("#travelSpeed").attr('value'),
      "printer.retraction.amount": $("#retractionAmount").attr('value'),
      "printer.retraction.minDistance": $("#retractionMinDistance").attr('value'),
      "printer.retraction.speed": $("#retractionSpeed").attr('value')
    },
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
      //          console.log(JSON.stringify(data));
      //          console.log(JSON.parse(data).data);
    }
  );
}



/*************************
 *
 *
 *  FROM DOODLE3D.INI
 *
 */
var objectHeight = 20;
var layerHeight = .2;
var wallThickness = .5;
var hop = 0;
var speed = 70;
var travelSpeed = 200;
var enableTraveling = true;
var filamentThickness = 2.89;
var minScale = .3;
var maxScale = 1;
var shape = "%";
var twists = 0;
var useSubLayers = true;
var debug = false;
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
var checkTemperatureInterval = 3;
var autoWarmUpDelay = 3;