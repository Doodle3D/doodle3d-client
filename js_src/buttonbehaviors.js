var twistIncrement = Math.PI/1800;

var btnNew, btnPrevious, btnNext, btnOops, btnStop, btnInfo, btnRotate;
var btnSettings, btnWordArt, btnZoom, btnMove, btnUpDown, btnTwist, btnShape, btnEditClosed, btnEditOpen;
var btnDiv,btnConv,btnStraight,btnSine, buttonGroupAdd, popupWordArt;

var state;
var prevState;
var hasControl;

var gcodeGenerateDelayer;
var gcodeGenerateDelay = 50;

function initButtonBehavior() {
  console.log("f:initButtonBehavior");

  $(".btn").Button(); //initalizes all buttons

  btnOops = $(".btnOops");
  btnInfo = $(".btnInfo");
  btnSettings = $(".btnSettings");
  btnNew = $(".btnNew");
  btnPrint= $(".btnPrint");
  btnStop = $(".btnStop");
  btnPrevious = $(".btnPrevious");
  btnNext = $(".btnNext");
  btnSave = $(".btnSave");
  btnWordArt = $(".btnWordArt");
  btnZoom = $(".btnZoom");
  btnUpDown = $(".btnUpDown");
  btnMove = $(".btnMove");
  btnTwist = $(".btnTwist");
  btnShape = $(".btnShape");
  btnRotate = $(".btnRotate");
  btnEditClosed = $(".btnEditClosed");
  btnEditOpen = $(".btnEditOpen");
  btnStraight = $(".btnStraight");
  btnDiv = $(".btnDiv");
  btnConv = $(".btnConv");
  btnSine = $(".btnSine");
  btnAdd = $(".btnAdd");
  buttonGroupAdd = $(".buttonGroupAdd");
  popupWordArt = $(".popupWordArt");
  popupShape = $(".popupShape");

  btnNew.on("onButtonClick", onBtnNew);
  btnWordArt.on("onButtonClick", onBtnWordArt);
  btnPrint.on("onButtonClick", onBtnPrint);
  btnZoom.on("onButtonHold", onBtnZoom);
  btnOops.on("onButtonHold", onBtnOops);
  btnUpDown.on("onButtonHold", onBtnUpDown);
  btnMove.on("onButtonHold", onBtnMove);
  btnTwist.on("onButtonHold", onBtnTwist);
  btnShape.on("onButtonClick", onBtnShape);
  btnRotate.on("onButtonHold", onBtnRotate);
  btnEditClosed.on("onButtonClick", onBtnEditClosed);
  btnEditOpen.on("onButtonHold", onBtnEditOpen);
  btnEditOpen.on("onButtonClick", onBtnEditOpen);
  btnStraight.on("onButtonClick", onBtnStraight);
  btnDiv.on("onButtonClick", onBtnDiv);
  btnConv.on("onButtonClick", onBtnConv);
  btnSine.on("onButtonClick", onBtnSine);
  btnAdd.on("onButtonClick", onBtnAdd);

  getSavedSketchStatus();
  setSketchModified(false);



  function onBtnAdd() {
    buttonGroupAdd.toggle();
  }

  function onBtnStraight() {
    setVerticalShape(verticalShapes.NONE);
  }

  function onBtnDiv() {
    setVerticalShape(verticalShapes.DIVERGING);
  }

  function onBtnConv() {
    setVerticalShape(verticalShapes.CONVERGING);
  }

  function onBtnSine() {
    setVerticalShape(verticalShapes.SINUS);
  }

  function onBtnEditClosed(e,cursor) {
    btnEditClosed.hide();
    btnEditOpen.show();
  }

  function hitTest(cursor,button,radius) {
    return distance(cursor.x,cursor.y,button.x,button.y)<radius;
  }

  function onBtnEditOpen(e,cursor) {
    // image is shown as 75% of its size (for retina screens)
    cursor.x /= .75;
    cursor.y /= .75;

    if (cursor.x < 27 && cursor.y < 27) {
      btnEditOpen.hide();
      btnEditClosed.show();
    } else {
      var btnUp = { x:59, y:38 };
      var btnDown = { x:59, y:89 };
      var btnLeft = { x:35, y:63 };
      var btnRight = { x:86, y:64 };
      var btnZoomIn = { x:33, y:133 };
      var btnZoomOut = { x:33, y:165 };
      var btnRotateCCW = { x:85, y:136 };
      var btnRotateCW = { x:86, y:167 };
      var step = 5;
      var radius = 20;

      if (hitTest(cursor,btnLeft,radius)) moveShape(-step,0);
      else if (hitTest(cursor,btnRight,radius)) moveShape(step,0);
      else if (hitTest(cursor,btnUp,radius)) moveShape(0,-step);
      else if (hitTest(cursor,btnDown,radius)) moveShape(0,step);
      else if (hitTest(cursor,btnZoomIn,radius)) zoomShape(1.05);
      else if (hitTest(cursor,btnZoomOut,radius)) zoomShape(.95);
      else if (hitTest(cursor,btnRotateCCW,radius)) rotateShape(-.1);
      else if (hitTest(cursor,btnRotateCW,radius)) rotateShape(.1);

      // console.log(cursor);
    }
  }

  function onBtnMove(e,cursor) {
    var btnUp = { x:40, y:19 };
    var btnDown = { x:40, y:54 };
    var btnLeft = { x:20, y:41 };
    var btnRight = { x:62, y:41 };
    var step = 5;
    var radius = 20;

    if (distance(cursor.x,cursor.y,btnLeft.x,btnLeft.y)<radius) moveShape(-step,0);
    else if (distance(cursor.x,cursor.y,btnRight.x,btnRight.y)<radius) moveShape(step,0);
    else if (distance(cursor.x,cursor.y,btnUp.x,btnUp.y)<radius) moveShape(0,-step);
    else if (distance(cursor.x,cursor.y,btnDown.x,btnDown.y)<radius) moveShape(0,step);
    
  }

  function onBtnUpDown(e,cursor) {
    if (cursor.y<25) previewUp(true);
    else if (cursor.y>55) previewDown(true);
  }

  function onBtnTwist(e,cursor) {
    if (cursor.y<25) previewTwistRight(true);
    else if (cursor.y>55) previewTwistLeft(true);
  }

  function onBtnOops(e) {
    oopsUndo();
  }

  function onBtnNew(e) {
    clearDoodle();
  }

  function onBtnZoom(e,cursor) {
    if (cursor.y<25) zoomShape(1.05);
    else if (cursor.y>55) zoomShape(.95);
  }

  function onBtnRotate(e,cursor) {
    if (cursor.y<25) rotateShape(.1);
    else if (cursor.y>55) rotateShape(-.1); 
  }

  function onBtnPrint(e) {
    print();
  }

  function onBtnWordArt(e) {
    showWordArtDialog();
  }

  function onBtnShape(e) {
    showShapeDialog();
    buttonGroupAdd.hide();
  }

  enableButton(btnSettings, openSettingsWindow);


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

}

function stopPrint() {
  console.log("f:stopPrint() >> sendPrintCommands = " + sendPrintCommands);
  //if (!confirm("Weet je zeker dat je huidige print wilt stoppen?")) return;
  if (sendPrintCommands) printer.stop();
  //setState(Printer.STOPPING_STATE,printer.hasControl);
  printer.overruleState(Printer.STOPPING_STATE);
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

			// if (debugMode) {
			// 	$("#textdump").text("");
			// 	$("#textdump").text(gcode.join("\n"));
			// }

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

  // also make new Image, otherwise the previously cached preview can be redrawn with move up/down or twist left/right
  doodleImageCapture = new Image();

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
  setSketchModified(true);

//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewDown(redrawLess) {
  //    console.log("f:previewDown()");
  if (numLayers > minNumLayers) {
    numLayers--;
  }
  setSketchModified(true);
//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewTwistLeft(redrawLess) {
  if (redrawLess == undefined) redrawLess = false;
  //    console.log("f:previewTwistLeft()");
  if (rStep > -previewRotationLimit) rStep -= twistIncrement;
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
  setSketchModified(true);
}
function previewTwistRight(redrawLess) {
  //    console.log("f:previewTwistRight()");
  if (rStep < previewRotationLimit) rStep += twistIncrement;
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
  setSketchModified(true);
}

function resetTwist() {
  rStep = 0;
  redrawRenderedPreview();
  setSketchModified(true);
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
		case Printer.WIFIBOX_DISCONNECTED_STATE:
			disableButton(btnPrevious);
			disableButton(btnNext);
			disableButton(btnSave);
			break;
		default:
			updatePrevNextButtonState();
			if (isModified) enableButton(btnSave, saveSketch);
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
