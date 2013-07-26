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

  btnOops.mousedown(function(e) {
    e.preventDefault();
    //      console.log("btnOops mouse down");
    btnOopsInterval = setInterval( function() {
      oopsUndo();
    }, 1000/50);
  });
  btnOops.mouseup(function(e) {
    e.preventDefault();
    //      console.log("btnOops mouse up");
    clearInterval(btnOopsInterval);
  });

  btnMoveUp.mousedown(function(e) {
    e.preventDefault();
    //      console.log("btnMoveUp mouse down");
    previewUp();
    clearInterval(btnMoveUpInterval);
    btnMoveUpInterval = setInterval( function() {
      previewUp();
    }, 1000/30);
  });
  btnMoveUp.mouseup(function(e) {
    e.preventDefault();
          console.log("btnMoveUp mouse up");
    clearInterval(btnMoveUpInterval);
  });

  btnMoveDown.mousedown(function(e) {
    e.preventDefault();
    //      console.log("btnMoveDown mouse down");
    previewDown();
    clearInterval(btnMoveDownInterval);
    btnMoveDownInterval = setInterval( function() {
      previewDown();
    }, 1000/30);
  });
  btnMoveDown.mouseup(function(e) {
    e.preventDefault();
          console.log("btnMoveDown mouse up");
    clearInterval(btnMoveDownInterval);
  });

  btnTwistLeft.mousedown(function(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse down");
    previewTwistLeft();
    clearInterval(btnTwistLeftInterval);
    btnTwistLeftInterval = setInterval( function() {
      previewTwistLeft();
    }, 1000/30);
  });
  btnTwistLeft.mouseup(function(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse up");
    clearInterval(btnTwistLeftInterval);
  });

  btnTwistRight.mousedown(function(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse down");
    previewTwistRight();
    clearInterval(btnTwistRightInterval);
    btnTwistRightInterval = setInterval( function() {
      previewTwistRight();
    }, 1000/30);
  });
  btnTwistRight.mouseup(function(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse up");
    clearInterval(btnTwistRightInterval);
  });

  btnSettings.mouseup(function(e) {
    e.preventDefault();
    console.log("btnSettings mouse up");
  });

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
  redrawPreview();
  clearMainView();
  prevX = 0;
  prevY = 0;
  for (var i = 0; i < _points.length; i++) {
    //      console.log("     drawing points " + _points[i]);
    if (_points[i][2] == true) {
      draw(_points[i][0], _points[i][1], 0.5);
    } else {
      draw(_points[i][0], _points[i][1]);
    }
  }

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