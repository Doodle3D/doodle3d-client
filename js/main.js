var debug = false;

var printer =  new Printer(); 

$(function() {
  console.log("ready");
  //var wifiboxURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
  var wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";
  console.log("wifibox URL: " + wifiboxURL);

  initLayouting();

  initDoodleDrawing();
  initPreviewRendering();

  initButtonBehavior();

  initSettingsPopup(wifiboxURL);

  $("#settings .settings").load("settings.html", function() {
    console.log("finished loading settings.html, now loading settings...");
    loadSettings();
  });

  if(debug) {
    console.log("debug mode");
    $("body").css("overflow", "auto");
    $("#debug_textArea").css("display", "block");
  }

	printer.init();
	printer.preheat();
	
	$(document).on(Printer.UPDATE,update);

})