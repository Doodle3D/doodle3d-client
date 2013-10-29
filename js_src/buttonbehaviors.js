var btnMoveUpInterval;
var btnMoveDownInterval;

var btnTwistLeftInterval;
var btnTwistRightInterval;
var twistIncrement = Math.PI/1800;

var btnOopsInterval;

var btnNew, btnPrevious, btnNext;
var btnOops, btnStop, btnClear;
var btnMoveUp, btnMoveDown, btnTwistLeft, btnTwistRight;
var btnInfo, btnSettings;
//var btnDebug; // debug

var state;
var prevState;
var hasControl;

var gcodeGenerateDelayer;
var gcodeGenerateDelay = 50;

function initButtonBehavior() {
  console.log("f:initButtonBehavior");

//  btnClear= $(".btnClear");
  btnOops = $(".btnOops");
  btnMoveUp = $("#btnMoveUp");
  btnMoveDown = $("#btnMoveDown");
  btnTwistLeft = $("#btnTwistLeft");
  btnTwistRight = $("#btnTwistRight");
  btnInfo = $(".btnInfo");
  btnSettings = $(".btnSettings");
  btnNew = $(".btnNew");
  btnPrint= $(".btnPrint");
  btnStop = $(".btnStop");

  btnPrevious = $(".btnPrevious");
  btnNext = $(".btnNext");
  btnSave = $(".btnSave");

  //debug
  //btnDebug = $(".debugBtn");

	btnNew.on('touchstart mousedown', clearDoodle);
	btnPrint.on('touchstart mousedown', print);

//  btnClear.click(function(e) {
//    e.preventDefault();
//    //      console.log("clear");
//
//    clearDoodle();
//  });

  function startOops(e) {
    console.log("f:startOops()");
    e.preventDefault();
    btnOopsInterval = setInterval( function() {
      oopsUndo();
    }, 1000/40);
  }
  function stopOops(e) {
    console.log("f:stopOops()");
    e.preventDefault();
    clearInterval(btnOopsInterval);
    redrawDoodle(true);
    redrawPreview();
  }
  btnOops.on('touchstart', function(e) { startOops(e); });
  btnOops.on('touchend', function(e) { stopOops(e); });
  btnOops.mousedown(function(e) { startOops(e); });
  btnOops.mouseup(function(e) { stopOops(e); });

  function startMoveUp(e) {
    e.preventDefault();
    //      console.log("btnMoveUp mouse down");
    previewUp(true);
    clearInterval(btnMoveUpInterval);
    btnMoveUpInterval = setInterval( function() {
      previewUp(true);
    }, 1000/30);
  }
  function stopMoveUp(e) {
    e.preventDefault();
    console.log("btnMoveUp mouse up");
    clearInterval(btnMoveUpInterval);
    previewUp();
  }
  btnMoveUp.mousedown(function(e) { startMoveUp(e) });
  btnMoveUp.mouseup(function(e) { stopMoveUp(e) });
  btnMoveUp.on('touchstart', function(e) { startMoveUp(e) });
  btnMoveUp.on('touchend', function(e) { stopMoveUp(e) });

  function startMoveDown(e) {
    e.preventDefault();
    //      console.log("btnMoveDown mouse down");
    previewDown(true);
    clearInterval(btnMoveDownInterval);
    btnMoveDownInterval = setInterval( function() {
      previewDown(true);
    }, 1000/30);
  }
  function stopMoveDown(e) {
    e.preventDefault();
    console.log("btnMoveDown mouse up");
    clearInterval(btnMoveDownInterval);
    previewDown();
  }
  btnMoveDown.mousedown(function(e) { startMoveDown(e) });
  btnMoveDown.mouseup(function(e) { stopMoveDown(e) });
  btnMoveDown.on('touchstart', function(e) { startMoveDown(e) });
  btnMoveDown.on('touchend', function(e) { stopMoveDown(e) });

  function startTwistLeft(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse down");
    previewTwistLeft(true);
    clearInterval(btnTwistLeftInterval);
    btnTwistLeftInterval = setInterval( function() {
      previewTwistLeft(true);
    }, 1000/30);
  }
  function stopTwistLeft(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse up");
    clearInterval(btnTwistLeftInterval);
    previewTwistLeft();
  }
  btnTwistLeft.mousedown(function(e) { startTwistLeft(e) });
  btnTwistLeft.mouseup(function(e) { stopTwistLeft(e) });
  btnTwistLeft.on('touchstart', function(e) { startTwistLeft(e) });
  btnTwistLeft.on('touchend', function(e) { stopTwistLeft(e) });

  function startTwistRight(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse down");
    previewTwistRight(true);
    clearInterval(btnTwistRightInterval);
    btnTwistRightInterval = setInterval( function() {
      previewTwistRight(true);
    }, 1000/30);
  }
  function stopTwistRight(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse up");
    clearInterval(btnTwistRightInterval);
    previewTwistRight();
  }
  btnTwistRight.mousedown(function(e) { startTwistRight(e) });
  btnTwistRight.mouseup(function(e) { stopTwistRight(e) });
  btnTwistRight.on('touchstart', function(e) { startTwistRight(e) });
  btnTwistRight.on('touchend', function(e) { stopTwistRight(e) });

  /*function openSettings() {
    console.log("f:openSettings()");
    $("#contentOverlay").fadeIn(1000, function() {
      loadSettings();
    });
  }*/
  enableButton(btnSettings, openSettingsWindow);

//  btnSettings.on('touchend', function(e) {
//    e.preventDefault();
//    console.log("btnSettings touchend");
//  });

  // 29-okt-2013 - we're not doing help for smartphones at the moment
  if (clientInfo.isSmartphone) {
    btnInfo.addClass("disabled");
  } else {
    btnInfo.mouseup(function(e) {
      e.preventDefault();
      console.log("btnInfo mouse up");
      helpTours.startTour(helpTours.WELCOMETOUR);
    });
  }

  // DEBUG
  /*
  //  $(".agentInfo").css("display", "none");
  btnDebug.click(function(e) {
    console.log("debugClick");
    $(".agentInfo").toggleClass("agentInfoToggle");
    e.preventDefault();
  })
  //*/

  //btnStop.on('touchstart mousedown',stopPrint);
}
function stopPrint() {
  console.log("f:stopPrint() >> sendPrintCommands = " + sendPrintCommands);
  //if (!confirm("Weet je zeker dat je huidige print wilt stoppen?")) return;
  if (sendPrintCommands) printer.stop();
  //setState(Printer.STOPPING_STATE,printer.hasControl);
  printer.overruleState(Printer.STOPPING_STATE);
}


function prevDoodle(e) {
  console.log("f:prevDoodle()");
  console.log("f:prevDoodle()");
}
function nextDoodle(e) {
  console.log("f:nextDoodle()");
}

function print(e) {
	console.log("f:print() >> sendPrintCommands = " + sendPrintCommands);

  //$(".btnPrint").css("display","none");

  if (_points.length > 2) {

  	//setState(Printer.BUFFERING_STATE,printer.hasControl);
    printer.overruleState(Printer.BUFFERING_STATE);

    btnStop.css("display","none"); // hack

    // we put the gcode generation in a little delay
    // so that for example the print button is disabled right away
    clearTimeout(gcodeGenerateDelayer);
    gcodeGenerateDelayer = setTimeout(function() {

    	var gcode = generate_gcode();
    	if (sendPrintCommands) {
    		if(gcode.length > 0) {
    			printer.print(gcode);
    		} else {
    			printer.overruleState(Printer.IDLE_STATE);
    			printer.startStatusCheckInterval();
    		}
			} else {
				console.log("sendPrintCommands is false: not sending print command to 3dprinter");
			}

			if (debugMode) {
				$("#textdump").text("");
				$("#textdump").text(gcode.join("\n"));
			}

    }, gcodeGenerateDelay);
  } else {
    console.log("f:print >> not enough points!");
  }

  //alert("Je tekening zal nu geprint worden");
  //$(".btnPrint").css("display","block");


  //	$.post("/doodle3d.of", { data:output }, function(data) {
  //	btnPrint.disabled = false;
  //	});
}


function clearMainView() {
  //    console.log("f:clearMainView()");
  ctx.save();
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.restore();
}
function resetPreview() {
  //    console.log("f:resetPreview()");

  // clear preview canvas
  previewCtx.save();
  previewCtx.clearRect(0,0,canvas.width, canvas.height);
  previewCtx.restore();

  // reset height and rotation to default values
  numLayers 	= previewDefaults.numLayers;     // current number of preview layers
  rStep 			= previewDefaults.rotation; // Math.PI/180; //Math.PI/40; //
}

function oopsUndo() {
  //    console.log("f:oopsUndo()");
  _points.pop();

  if (clientInfo.isSmartphone) {
    // do not recalc the whole preview's bounds during undo if client device is a smartphone
    redrawDoodle(false);
  } else {
    // recalc the whole preview's bounds during if client device is not a smartphone
    redrawDoodle(true);
  }
  redrawPreview();
}
function previewUp(redrawLess) {
  //    console.log("f:previewUp()");
  if (numLayers < maxNumLayers) {
    numLayers++;
  }
//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewDown(redrawLess) {
  //    console.log("f:previewDown()");
  if (numLayers > minNumLayers) {
    numLayers--;
  }
//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewTwistLeft(redrawLess) {
  if (redrawLess == undefined) redrawLess = false;
  //    console.log("f:previewTwistLeft()");
  if (rStep > -previewRotationLimit) rStep -= twistIncrement;
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewTwistRight(redrawLess) {
  //    console.log("f:previewTwistRight()");
  if (rStep < previewRotationLimit) rStep += twistIncrement;
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}



function update() {
	setState(printer.state,printer.hasControl);

	thermometer.update(printer.temperature, printer.targetTemperature);
	progressbar.update(printer.currentLine, printer.totalLines);
}

function setState(newState,newHasControl) {
	if(newState == state && newHasControl == hasControl) return;

	prevState = state;

	console.log("setState: ",prevState," > ",newState," ( ",newHasControl,")");
	setDebugText("State: "+newState);

	// print button
	var printEnabled = (newState == Printer.IDLE_STATE && newHasControl);
	if(printEnabled) {
			btnPrint.removeClass("disabled"); // enable print button
			btnPrint.unbind('touchstart mousedown');
			btnPrint.bind('touchstart mousedown',print);
	} else {
			btnPrint.addClass("disabled"); // disable print button
			btnPrint.unbind('touchstart mousedown');
	}

	// stop button
	var stopEnabled = ((newState == Printer.PRINTING_STATE || newState == Printer.BUFFERING_STATE) && newHasControl);
	if(stopEnabled) {
		btnStop.removeClass("disabled");
		btnStop.unbind('touchstart mousedown');
		btnStop.bind('touchstart mousedown',stopPrint);
	} else {
		btnStop.addClass("disabled");
		btnStop.unbind('touchstart mousedown');
	}

	// thermometer
	switch(newState) {
		case Printer.IDLE_STATE: /* fall-through */
		case Printer.BUFFERING_STATE: /* fall-through */
		case Printer.PRINTING_STATE: /* fall-through */
		case Printer.STOPPING_STATE:
			thermometer.show();
			break;
		default:
			thermometer.hide();
			break;
	}

	// progress indicator
	switch(newState) {
		case Printer.PRINTING_STATE:
			progressbar.show();
			break;
		default:
			progressbar.hide();
			break;
	}

	/* settings button */
	switch(newState) {
    case Printer.IDLE_STATE:
      enableButton(btnSettings, openSettingsWindow);
      break;
    case Printer.WIFIBOX_DISCONNECTED_STATE: /* fall-through */
    case Printer.BUFFERING_STATE: /* fall-through */
    case Printer.PRINTING_STATE: /* fall-through */
    case Printer.STOPPING_STATE:
      disableButton(btnSettings);
      break;
    default:
      enableButton(btnSettings, openSettingsWindow);
      break;
  }
	
	/* save, next and prev buttons */
	switch(newState) {
		/*case Printer.WIFIBOX_DISCONNECTED_STATE:
			disableButton(btnPrevious);
			disableButton(btnNext);
			disableButton(btnSave);
			break;
		default:
			enableButton(btnPrevious, null);
			enableButton(btnNext, null);
			enableButton(btnSave, null);
			break;*/
		default:
			disableButton(btnPrevious);
			disableButton(btnNext);
			disableButton(btnSave);
			break;
	}

	if(newState == Printer.WIFIBOX_DISCONNECTED_STATE) {
		message.set("Lost connection to WiFi box",Message.ERROR);
	}	else if(prevState == Printer.WIFIBOX_DISCONNECTED_STATE) {
		message.set("Connected to WiFi box",Message.INFO,true);
	} else if(newState == Printer.DISCONNECTED_STATE) {
		message.set("Printer disconnected",Message.WARNING,true);
	} else if(prevState == Printer.DISCONNECTED_STATE && newState == Printer.IDLE_STATE ||
						prevState == Printer.UNKNOWN_STATE && newState == Printer.IDLE_STATE) {
		message.set("Printer connected",Message.INFO,true);
	}	else if(prevState == Printer.PRINTING_STATE && newState == Printer.STOPPING_STATE) {
		console.log("stopmsg show");
		message.set("Printer stopping",Message.INFO,false);
	}	else if(prevState == Printer.STOPPING_STATE && newState == Printer.IDLE_STATE) {
		console.log("stopmsg hide");
		message.hide();
	}

	state = newState;
	hasControl = newHasControl;
}
