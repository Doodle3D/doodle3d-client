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
var btnDebug; // debug

var displayTempEnabled = false;

var IDLE_STATE = "idle";
var PRINTING_STATE = "printing";

var state = IDLE_STATE;
var prevState = state;

function initButtonBehavior() {
  console.log("f:initButtonBehavior >> btnNew = " + btnNew);

  btnClear= $("#btnClear");
  btnOops = $("#btnOops");
  btnMoveUp = $("#btnMoveUp");
  btnMoveDown = $("#btnMoveDown");
  btnTwistLeft = $("#btnTwistLeft");
  btnTwistRight = $("#btnTwistRight");
  btnInfo = $("#btnInfo");
  btnSettings = $("#btnSettings");
  btnNew = $("#btnNew");
  btnPrint= $("#btnPrint");
  btnStop = $("#btnStop");
  displayTemp = $("#displayTemp");

//  btnPrevious = $("#btnPrevious");
//  btnNext = $("#btnNext");

  //debug
  btnDebug = $(".debugBtn");

	btnNew.bind('touchstart mousedown',clearDoodle);
	btnPrint.bind('touchstart mousedown',print);

	// not using these at the moment
	$("#btnPrevious").css("opacity", "0.3");
	$("#btnNext").css("opacity", "0.3");
	$("#btnSave").css("opacity", "0.3");
	$("#btnInfo").css("opacity", "0.3");

  btnClear.click(function(e) {
    e.preventDefault();
    //      console.log("clear");

    clearDoodle();
  });

  function startOops(e) {
    //      console.log("btnOops mouse down");
    e.preventDefault();
    btnOopsInterval = setInterval( function() {
      oopsUndo();
    }, 1000/50);
  }
  function stopOops(e) {
    //      console.log("btnOops mouse up");
    e.preventDefault();
    clearInterval(btnOopsInterval);
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
  btnSettings.bind('touchstart mousedown',function () {
    //e.preventDefault();
    //console.log("btnSettings clicked");
    settingsWindow.showSettings();
  });
//  btnSettings.on('touchend', function(e) {
//    e.preventDefault();
//    console.log("btnSettings touchend");
//  });

  btnInfo.mouseup(function(e) {
    e.preventDefault();
    console.log("btnInfo mouse up");
  });

  // DEBUG
  //  $(".agentInfo").css("display", "none");
  btnDebug.click(function(e) {
    console.log("debugClick");
    $(".agentInfo").toggleClass("agentInfoToggle");
    e.preventDefault();
  })

  btnStop.bind('touchstart mousedown',stopPrint);
}
function stopPrint() {
  console.log("f:stopPrint() >> sendPrintCommands = " + sendPrintCommands);
  if (sendPrintCommands) printer.stop();
  setState(IDLE_STATE);
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

  if (sendPrintCommands) {
    $("#textdump").text("");
    if (_points.length > 2) {

      setState(PRINTING_STATE);
      var gcode = generate_gcode();
      //startPrint(gencode);
      printer.print(gcode);

      //		console.log("");
      //		console.log("");
      //		console.log("-------------------------------------------------");
      //		console.log("generated gcode:");
      //		console.log(gencode);
      //		console.log("-------------------------------------------------");
      //		console.log("");
      //		console.log("");
      //		console.log("");

      if (debugMode) $("#textdump").text(gcode.join("\n"));

      //  copyToClipboard(gencode);
      //*/
    } else {
      console.log("f:print >> not enough points!");
    }


    //	$.post("/doodle3d.of", { data:output }, function(data) {
    //	btnPrint.disabled = false;
    //	});
  } else {
    console.log("sendPrintCommands is false: not sending print command to 3dprinter");
  }
}


function clearMainView() {
  //    console.log("f:clearMainView()");
  ctx.save();
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.restore();
}
function clearPreview() {
  //    console.log("f:clearPreview()");
  previewCtx.save();
  previewCtx.clearRect(0,0,canvas.width, canvas.height);
  previewCtx.restore();
}

function oopsUndo() {
  //    console.log("f:oopsUndo()");
  _points.pop();
  redrawDoodle();
  redrawPreview();
}
function previewUp(redrawLess) {
  //    console.log("f:previewUp()");
  if (numLayers < 100) {
    numLayers++;
  }
//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewDown(redrawLess) {
  //    console.log("f:previewDown()");
  if (numLayers > 2) {
    numLayers--;
  }
//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewTwistLeft(redrawLess) {
  if (redrawLess == undefined) redrawLess = false;
  //    console.log("f:previewTwistLeft()");
  //        if (rStep < Math.PI) {
  rStep -= twistIncrement;
  //        }
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewTwistRight(redrawLess) {
  //    console.log("f:previewTwistRight()");
  //        if (rStep < Math.PI) {
  rStep += twistIncrement;
  //        }
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}



function update() {
	if(!displayTempEnabled && printer.alive) {
		displayTemp.show();
		displayTempEnabled = true;
	} else if(displayTempEnabled && !printer.alive) {
		displayTemp.hide();
		displayTempEnabled = false;
	}
	
	if(displayTempEnabled) {
		displayTemp.text(printer.temperature+"/"+printer.targetTemperature);
	}

	var btnPrint= $("#btnPrint");	
	
	setState(printer.printing? PRINTING_STATE : IDLE_STATE);
}


function setState(newState) {
	if(newState == state) return;
	
	switch(newState) {
		case IDLE_STATE: 

			btnPrint.removeClass("disabled"); // enable print button
			btnStop.addClass("disabled"); // disable stop button
			btnPrint.bind('touchstart mousedown',print);

			break;
		case PRINTING_STATE: 
			
			btnPrint.addClass("disabled"); // disable print button
			btnStop.removeClass("disabled"); // enable stop button
			btnPrint.unbind('touchstart mousedown');
		
			break;
	}
	
	prevState = state;
	state = newState;
	
}