var debugMode = false;              // debug mode
var sendPrintCommands = true;       // if Doodle3d should send print commands to the 3d printer
var communicateWithWifibox = true;  // if Doodle3d should try interfacing with the wifibox (in case one is not connected)
var wifiboxIsRemote = false;        // when you want to run the client on a computer and have it remotely connect to the wifibox

var printer =  new Printer(); 

$(function() {
  console.log("ready");

  if (getURLParameter("d") != "null") debugMode = (getURLParameter("d") == "1");
  if (getURLParameter("p") != "null") sendPrintCommands = (getURLParameter("p") == "1");
  if (getURLParameter("c") != "null") communicateWithWifibox = (getURLParameter("c") == "1");
  if (getURLParameter("r") != "null") wifiboxIsRemote = (getURLParameter("r") == "1");


	if (wifiboxIsRemote) {
		wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";
	} else {
		wifiboxURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
	}
	
  if (!communicateWithWifibox) {
    sendPrintCommands = false; // 'communicateWithWifibox = false' implies this
  }
  console.log("debugMode: " + debugMode);
  console.log("sendPrintCommands: " + sendPrintCommands);
  console.log("communicateWithWifibox: " + communicateWithWifibox);
  console.log("wifiboxIsRemote: " + wifiboxIsRemote);
  console.log("wifibox URL: " + wifiboxURL);

  initLayouting();

  initDoodleDrawing();
  initPreviewRendering();


  initButtonBehavior();

  initSettingsPopup(wifiboxURL);

  $("#settings .settings").load("settings.html", function() {
    if (communicateWithWifibox) {
      console.log("finished loading settings.html, now loading settings...");
      loadSettings();
    } else {
      console.log("finished loading settings.html >> communicateWithWifibox is false: not loading settings");
    }
  });

  if(debugMode) {
    console.log("debug mode is true");
    $("body").css("overflow", "auto");
    $("#debug_textArea").css("display", "block");
    $("#preview_tmp").css("display", "block");
  }

	printer.init();
	if (communicateWithWifibox) printer.preheat();
	
	$(document).on(Printer.UPDATE,update);

})