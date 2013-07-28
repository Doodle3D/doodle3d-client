var btnMoveUpInterval;
var btnMoveDownInterval;

var btnTwistLeftInterval;
var btnTwistRightInterval;
var twistIncrement = Math.PI/1800;

var btnOopsInterval;

//var btnNew, btnPrevious, btnNext;
var btnOops, btnStop, btnClear;
var btnMoveUp, btnMoveDown, btnTwistLeft, btnTwistRight;
var btnInfo, btnSettings;
var btnDebug; // debug

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
//  btnPrint= $("#btnPrint");

//  btnPrevious = $("#btnPrevious");
//  btnNext = $("#btnNext");

  //debug
  btnDebug = $(".debugBtn");

  if (!btnNew.addEventListener) {
    btnNew.attachEvent('onmousedown',clearDoodle);
    btnNew.attachEvent('ontouchstart',clearDoodle);
    btnPrint.attachEvent('onmousedown',print);
    btnPrint.attachEvent('ontouchstart',print);

//    btnPrevious.attachEvent('onmousedown',prevDoodle);
//    btnPrevious.attachEvent('ontouchstart',prevDoodle);
//    btnNext.attachEvent('onmousedown',nextDoodle);
//    btnNext.attachEvent('ontouchstart',nextDoodle);
  } else {
    btnNew.addEventListener('mousedown',clearDoodle,false);
    btnNew.addEventListener('touchstart',clearDoodle,false);
    btnPrint.addEventListener('mousedown',print,false);
    btnPrint.addEventListener('touchstart',print,false);

//    btnPrevious.addEventListener('mousedown',prevDoodle,false);
//    btnPrevious.addEventListener('touchstart',prevDoodle,false);
//    btnNext.addEventListener('mousedown',nextDoodle,false);
//    btnNext.addEventListener('touchstart',nextDoodle,false);
  }

  btnClear.click(function(e) {
    e.preventDefault();
    //      console.log("clear");

    clearDoodle();
  });

//  btnPrevious.mouseup(function(e) {
//    e.preventDefault();
//    console.log("btnPrevious");
//  })
//  btnPrevious.bind("touchend", function(e) {
//    e.preventDefault();
//    console.log("btnPrevious");
//  })
//  btnNext.mouseup(function(e) {
//    e.preventDefault();
//    console.log("btnNext");
//  })
//  btnNext.bind("touchend", function(e) {
//    e.preventDefault();
//    console.log("btnPrevious");
//  })

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
    previewUp();
    clearInterval(btnMoveUpInterval);
    btnMoveUpInterval = setInterval( function() {
      previewUp();
    }, 1000/30);
  }
  function stopMoveUp(e) {
    e.preventDefault();
    console.log("btnMoveUp mouse up");
    clearInterval(btnMoveUpInterval);
  }
  btnMoveUp.mousedown(function(e) { startMoveUp(e) });
  btnMoveUp.mouseup(function(e) { stopMoveUp(e) });
  btnMoveUp.on('touchstart', function(e) { startMoveUp(e) });
  btnMoveUp.on('touchend', function(e) { stopMoveUp(e) });

  function startMoveDown(e) {
    e.preventDefault();
    //      console.log("btnMoveDown mouse down");
    previewDown();
    clearInterval(btnMoveDownInterval);
    btnMoveDownInterval = setInterval( function() {
      previewDown();
    }, 1000/30);
  }
  function stopMoveDown(e) {
    e.preventDefault();
    console.log("btnMoveDown mouse up");
    clearInterval(btnMoveDownInterval);
  }
  btnMoveDown.mousedown(function(e) { startMoveDown(e) });
  btnMoveDown.mouseup(function(e) { stopMoveDown(e) });
  btnMoveDown.on('touchstart', function(e) { startMoveDown(e) });
  btnMoveDown.on('touchend', function(e) { stopMoveDown(e) });

  function startTwistLeft(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse down");
    previewTwistLeft();
    clearInterval(btnTwistLeftInterval);
    btnTwistLeftInterval = setInterval( function() {
      previewTwistLeft();
    }, 1000/30);
  }
  function stopTwistLeft(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse up");
    clearInterval(btnTwistLeftInterval);
  }
  btnTwistLeft.mousedown(function(e) { startTwistLeft(e) });
  btnTwistLeft.mouseup(function(e) { stopTwistLeft(e) });
  btnTwistLeft.on('touchstart', function(e) { startTwistLeft(e) });
  btnTwistLeft.on('touchend', function(e) { stopTwistLeft(e) });

  function startTwistRight(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse down");
    previewTwistRight();
    clearInterval(btnTwistRightInterval);
    btnTwistRightInterval = setInterval( function() {
      previewTwistRight();
    }, 1000/30);
  }
  function stopTwistRight(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse up");
    clearInterval(btnTwistRightInterval);
  }
  btnTwistRight.mousedown(function(e) { startTwistRight(e) });
  btnTwistRight.mouseup(function(e) { stopTwistRight(e) });
  btnTwistRight.on('touchstart', function(e) { startTwistRight(e) });
  btnTwistRight.on('touchend', function(e) { stopTwistRight(e) });

  function openSettings() {
    console.log("f:openSettings()");
    $("#contentOverlay").fadeIn(1000, function() {
      loadSettings();
    });

  }
  btnSettings.click(function(e) {
    e.preventDefault();
    console.log("btnSettings clicked");
    showSettings();
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
}


function prevDoodle(e) {
  console.log("f:prevDoodle()");
}
function nextDoodle(e) {
  console.log("f:nextDoodle()");
}

function print(e) {
  console.log("f:print()");

  $("#textdump").text("");
  if (_points.length > 2) {
    //*
     //  generate_gcode();
     var gencode = generate_gcode();
    startPrint();

//     console.log("");
//     console.log("");
//     console.log("-------------------------------------------------");
//     console.log("generated gcode:");
//     console.log(gencode);
//     console.log("-------------------------------------------------");
//     console.log("");
//     console.log("");
//     console.log("");

     $("#textdump").text(gencode);
     //  copyToClipboard(gencode);
     //*/
  } else {
    console.log("f:print >> not enough points!");
  }


//  $.post("/doodle3d.of", { data:output }, function(data) {
//    btnPrint.disabled = false;
//  });
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
function previewUp() {
  //    console.log("f:previewUp()");
  if (numLayers < 100) {
    numLayers++;
  }
  redrawPreview();
}
function previewDown() {
  //    console.log("f:previewDown()");
  if (numLayers > 2) {
    numLayers--;
  }
  redrawPreview();
}
function previewTwistLeft() {
  //    console.log("f:previewTwistLeft()");
  //        if (rStep < Math.PI) {
  rStep -= twistIncrement;
  //        }
  redrawPreview();
}
function previewTwistRight() {
  //    console.log("f:previewTwistRight()");
  //        if (rStep < Math.PI) {
  rStep += twistIncrement;
  //        }
  redrawPreview();
}