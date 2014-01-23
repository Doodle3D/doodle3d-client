/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

/* * * * * * * * * *
 *
 *  VARS
 *
 * * * * * * * * * */
var preview;
var previewCtx;

var svgPathRegExp = /[LM]\d* \d*/ig;
var svgPathParamsRegExp = /([LM])(\d*) (\d*)/;

var dragging = false;

var $canvas, canvas, ctx;
var canvasWidth, canvasHeight;

var drawCanvas;
var drawCanvasTopLeftCoords = [0, 0];

var doodleBounds = [-1, -1, -1, -1]; // left, top, right, bottom
//  var doodleScaleVals = [[0, 0], [1.0, 1.0]]; // [ [x, y], [scaleX, scaleY] ]
var doodleTransform = [0, 0, 1.0, 1.0]; // [ x, y, scaleX, scaleY ]

var _points = [];

var prevCountingTime = 0;
var movementCounter = 0;

var drawVariableLineWeight = false; // set to true to have the momentum of the mouse/touch movement result in larger/smaller strokes
var lineweight = 2;

var isModified = false;

/* * * * * * * * * *
 *
 *  INIT
 *
 * * * * * * * * * */
function initDoodleDrawing() {
  //console.log("f:initDoodleDrawing()");

  $canvas = $("#mycanvas");
  canvas = $canvas[0];
  ctx = canvas.getContext('2d');

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;


  //*
  //TODO make these jquery eventhandlers (works for all)
  if (!canvas.addEventListener) {
    canvas.attachEvent('onmousedown',onCanvasMouseDown);
    canvas.attachEvent('onmousemove',onCanvasMouseMove);
    canvas.attachEvent('onmouseup',onCanvasMouseUp);
    canvas.attachEvent('ontouchstart',onCanvasTouchDown);
    canvas.attachEvent('ontouchmove',onCanvasTouchMove);
    canvas.attachEvent('ontouchend',onCanvasTouchEnd);
    document.body.attachEvent('ontouchmove',prevent);
  } else {
    canvas.addEventListener('mousedown',onCanvasMouseDown,false);
    canvas.addEventListener('mousemove',onCanvasMouseMove,false);
    canvas.addEventListener('mouseup',onCanvasMouseUp,false);
    canvas.addEventListener('touchstart',onCanvasTouchDown,false);
    canvas.addEventListener('touchmove',onCanvasTouchMove,false);
    canvas.addEventListener('touchend',onCanvasTouchEnd,false);
    if (!debugMode) document.body.addEventListener('touchmove',prevent,false);
  }
  //*/

//  drawCanvas = $(".drawareacontainer");
  drawCanvas = $("#mycanvasContainer"); // $("#drawAreaContainer")

  //console.log("drawCanvasTopLeftCoords: " + drawCanvasTopLeftCoords);
//  drawCanvasTopLeftCoords[0] = drawCanvas.css("left").match(/[0-9]/g).join("");
//  drawCanvasTopLeftCoords[1] = drawCanvas.css("top").match(/[0-9]/g).join("");
  drawCanvasTopLeftCoords[0] = drawCanvas.offset().left;
  drawCanvasTopLeftCoords[1] = drawCanvas.offset().top;
//  drawCanvasTopLeftCoords[0] = drawCanvas[0].offsetParent.offsetLeft;
//  drawCanvasTopLeftCoords[1] = drawCanvas[0].offsetParent.offsetTop;

  //console.log("f:initDoodleDrawing() >> canvasWidth: " + canvasWidth);
  //console.log("f:initDoodleDrawing() >> canvasHeight: " + canvasHeight);

}

/* * * * * * * * * *
 *
 *  CANVAS DRAWING FUNCTION
 *
 * * * * * * * * * */
function draw(_x, _y, _width) {
	//console.log("canvasDrawing:draw");
  //    console.log("f:draw() >> _width: " + _width);

  if (prevX == 0 && prevY ==0) {
    prevX = _x;
    prevY = _y;
  }

  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(_x, _y);

  if (_width != undefined) {
    ctx.lineWidth = _width;
  } else {
    if (drawVariableLineWeight) {
      var dist = Math.sqrt(Math.pow((prevX - _x), 2) + Math.pow((prevY - _y), 2));
      if (dist < 10) {
        lineweight += .25;
      } else if (dist < 20) {
        lineweight += .5;
      } else if (dist < 30) {
        lineweight += .75;
      } else if (dist < 50) {
        lineweight += 1;
      } else if (dist < 80) {
        lineweight += 1.5;
      } else if (dist < 120) {
        lineweight += 2.25;
      } else if (dist < 170) {
        lineweight += 3.5;
      } else {
        lineweight += 2;
      }
      lineweight = Math.min(lineweight, 30);
      lineweight *= 0.90;
      lineweight = Math.max(lineweight, 1.0);
    } else {
      lineweight = 2;
    }

    ctx.lineWidth = lineweight;
  }
  ctx.lineCap = 'round';
  ctx.stroke();

  prevX = _x;
  prevY = _y;
}


/* * * * * * * * * *
 *
 *  SUPPORTING FUNCTIONS
 *
 * * * * * * * * * */
function clearDoodle() {
  //console.log("f:clearDoodle");

  updatePrevNextButtonStateOnClear();

  _points = [];

  prevX = 0;
  prevY = 0;

  updatePrevX = -1;
  updatePrevY = -1;

  doodleBounds = [-1, -1, -1, -1]; // left, top, right, bottom
  doodleTransform = [0, 0, 1.0, 1.0]; // [ x, y, scaleX, scaleY ]

  dragging = false;

  clearMainView();
  resetPreview();
  resetVerticalShapes();

  setSketchModified(false);
}

function redrawDoodle(recalcBoundsAndTransforms) {
	//console.log("canvasDrawing:redrawDoodle");
  if (recalcBoundsAndTransforms == undefined) recalcBoundsAndTransforms = false;
//  console.log("f:redrawDoodle() >> recalcBoundsAndTransforms = " + recalcBoundsAndTransforms);

  if (recalcBoundsAndTransforms == true) {
    doodleBounds = [-1, -1, -1, -1]; // left, top, right, bottom
    doodleTransform = [0, 0, 1.0, 1.0]; // [ x, y, scaleX, scaleY ]
    for (var i = 0; i < _points.length; i++) {
      adjustBounds(_points[i][0], _points[i][1]);
      adjustPreviewTransformation();
    }
  }

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
// checks if x,y is outside doodleBounds, if so update 
 function adjustBounds(x, y) {
	 //console.log("canvasDrawing:adjustBounds");
  var newPointsOutsideOfCurrentBounds = false;
//      console.log("f:adjustBounds("+x+","+y+")");

  if (doodleBounds[0] == -1) {
    // if doodleBounds[0] is -1 then it isn't initted yet, so x and y are both the min and max vals

    doodleBounds[0] = x;
    doodleBounds[1] = y;
    doodleBounds[2] = x;
    doodleBounds[3] = y;
    return;
  }

  if (x < doodleBounds[0]) {
   doodleBounds[0] = x;
   newPointsOutsideOfCurrentBounds = true;
  }
  if (x > doodleBounds[2]) {
   doodleBounds[2] = x;
   newPointsOutsideOfCurrentBounds = true;
  }
 if (y < doodleBounds[1]) {
   doodleBounds[1] = y;
   newPointsOutsideOfCurrentBounds = true;
 }
 if (y > doodleBounds[3]) {
   doodleBounds[3] = y;
   newPointsOutsideOfCurrentBounds = true;
 }

 return newPointsOutsideOfCurrentBounds;
}

// does what exactly?
function adjustPreviewTransformation() {
	//console.log("canvasDrawing:adjustPreviewTransformation");

  doodleTransform[0] = doodleBounds[0];
  doodleTransform[1] = doodleBounds[1];

  var sclX, sclY, finalScl;
  if (_points.length < 2) {
//    console.log(_points);
    sclX = 1.0;
    sclY = 1.0;
    finalScl = Math.min(sclX, sclY);
  } else {
    sclX = canvasWidth / (doodleBounds[2] - doodleBounds[0]);
    sclY = canvasHeight / (doodleBounds[3] - doodleBounds[1]);

    // TODO  this shouldn't be a matter if choosing the smallest but should probably involve maintaining aspect ratio??
    finalScl = Math.min(sclX, sclY);
  }

  doodleTransform[2] = finalScl;
  doodleTransform[3] = finalScl;
}


/* * * * * * * * * *
 *
 *  MOUSE/TOUCH EVENTHANDLERS
 *
 * * * * * * * * * */
function onCanvasMouseDown(e) {
	//console.log("canvasDrawing:onCanvasMouseDown");
    setSketchModified(true);

//  console.log("f:onCanvasMouseDown()");
  //  console.log("onCanvasMouseDown >> e.offsetX,e.offsetY = " + e.offsetX+","+e.offsetY);
  //  console.log("onCanvasMouseDown >> e.layerX,e.layerY= " + e.layerX+","+e.layerY);
  //  console.log("onCanvasMouseDown >> e: " , e);
  dragging = true;

  prevCountingTime = new Date().getTime();
  movementCounter = 0

  var x, y;
  if (e.offsetX != undefined) {
    x = e.offsetX;
    y = e.offsetY;
  } else {
    x = e.layerX;
    y = e.layerY;
  }
//  console.log("     x: " + x + ", y: " + y);

  _points.push([x, y, true]);
  adjustBounds(x, y);
  adjustPreviewTransformation();
  draw(x, y, 0.5);
}

var prevPoint = {x:-1, y:-1};
function onCanvasMouseMove(e) {
	//console.log("canvasDrawing:onCanvasMouseMove");
//  console.log("f:onCanvasMouseMove()");
  if (!dragging) return;

  setSketchModified(true);

  //    console.log("onmousemove");

  var x, y;
  if (e.offsetX != undefined) {
    x = e.offsetX;
    y = e.offsetY;
  } else {
    x = e.layerX;
    y = e.layerY;
  }

  if (prevPoint.x != -1 || prevPoint.y != -1) {
    var dist = Math.sqrt(((prevPoint.x - x) * (prevPoint.x - x)) + ((prevPoint.y - y) * (prevPoint.y - y)));
    if (dist > 5) { // replace by setting: doodle3d.simplify.minDistance
      _points.push([x, y, false]);
      adjustBounds(x, y);
      adjustPreviewTransformation();
      draw(x, y);
      prevPoint.x = x;
      prevPoint.y = y;
    }
  } else {
    // this is called once, every time you start to draw a line
    _points.push([x, y, false]);
    adjustBounds(x, y);
    adjustPreviewTransformation();
    draw(x, y);
    prevPoint.x = x;
    prevPoint.y = y;
  }

  // DEBUG
//  $("#textdump").text("");
//  $("#textdump").append("doodlebounds:" + doodleBounds + "\n");
//  $("#textdump").append("doodletransform:" + doodleTransform + "\n");

  if (new Date().getTime() - prevRedrawTime > redrawInterval) {
    // redrawing the whole preview the first X points ensures that the doodleBounds is set well
    prevRedrawTime = new Date().getTime();
    // Keep fully updating the preview if device is not a smartphone.
    // (An assumption is made here that anything greater than a smartphone will have sufficient
    // performance to always redraw the preview.)
    if (_points.length < 50 || !clientInfo.isSmartphone) {
      redrawPreview();
    } else {
      updatePreview(x, y, true);
    }
  }
}
prevUpdateFullPreview = 0; // 0 is not a timeframe but refers to the _points array
prevUpdateFullPreviewInterval = 25; // refers to number of points, not a timeframe

function onCanvasMouseUp(e) {
//  console.log("f:onCanvasMouseUp()");
  //    console.log("onmouseup");
  dragging = false;
  //console.log("doodleBounds: " + doodleBounds);
  //console.log("doodleTransform: " + doodleTransform);
  //    ctx.stroke();

  //console.log("_points.length :" + _points.length);
//  console.log(_points);

  // DEBUG
//  $("#textdump").text("");
//  $("#textdump").append("doodlebounds:" + doodleBounds + "\n");
//  $("#textdump").append("doodletransform:" + doodleTransform + "\n");

//  redrawPreview();
  renderToImageDataPreview();
}

function onCanvasTouchDown(e) {
  setSketchModified(true);

  e.preventDefault();
  //console.log("f:onCanvasTouchDown >> e: " , e);
//  var x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
//  var y = e.touches[0].pageY - e.touches[0].target.offsetTop;
  var x = e.touches[0].pageX - drawCanvasTopLeftCoords[0];
  var y = e.touches[0].pageY - drawCanvasTopLeftCoords[1];
//  var x = e.touches[0].pageX;
//  var y = e.touches[0].pageY;
//  var x = e.touches[0].layerX;
//  var y = e.touches[0].layerY;

  _points.push([x, y, true]);
  adjustBounds(x, y);
  adjustPreviewTransformation();
  draw(x, y, .5);

  movementCounter = 0;

  prevRedrawTime = new Date().getTime();
}

function onCanvasTouchMove(e) {
	//console.log("canvasDrawing:onCanvasTouchMove");
  setSketchModified(true);

  e.preventDefault();
//  var x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
//  var y = e.touches[0].pageY - e.touches[0].target.offsetTop;
    var x = e.touches[0].pageX - drawCanvasTopLeftCoords[0];
    var y = e.touches[0].pageY - drawCanvasTopLeftCoords[1];
//    var x = e.touches[0].layerX;
//    var y = e.touches[0].layerY;
//  var x = e.touches[0].layerX;
//  var y = e.touches[0].layerY;

  //console.log("f:onCanvasTouchMove >> x,y = "+x+","+y+" , e: " , e);

  if (prevPoint.x != -1 || prevPoint.y != -1) {
    var dist = Math.sqrt(Math.pow((prevPoint.x - x), 2) + Math.pow((prevPoint.y - y), 2));
    if (dist > 5) {
      _points.push([x, y, false]);
      adjustBounds(x, y)
      adjustPreviewTransformation();
      draw(x, y);
      prevPoint.x = x;
      prevPoint.y = y;
    }
  } else {
    _points.push([x, y, false]);
    adjustBounds(x, y)
    adjustPreviewTransformation();
    draw(x, y);
    prevPoint.x = x;
    prevPoint.y = y;
  }

  // update counter -> this was for getting a handle on how often the Canvas fires a move-event
  /*
   movementCounter++;
   if (new Date().getTime() - prevCountingTime > 1000) {
   //      console.log("number of moves in 1sec: " + movementCounter)
   prevCountingTime= new Date().getTime();
   $("#numtimes").text(movementCounter + " times");
   movementCounter = 0;
   }
   //*/

  if (new Date().getTime() - prevRedrawTime > redrawInterval) {
    // redrawing the whole preview the first X points ensures that the doodleBounds is set well
    if (_points.length < 50) {
      redrawPreview();
    } else {
      updatePreview(x, y, true);
      /*
      if (_points.length - prevUpdateFullPreview > prevUpdateFullPreviewInterval) {
        console.log("f:onTouchMove >> passed prevUpdateFullPreviewInterval, updating full preview");
        redrawPreview();
        prevUpdateFullPreview = _points.length;
      } else {
        updatePreview(x, y, true);
      }
      //*/
    }
    prevRedrawTime = new Date().getTime();
  }
}

function onCanvasTouchEnd(e) {
  //console.log("f:onCanvasTouchEnd()");
  //console.log("doodleBounds: " + doodleBounds);
  //console.log("doodleTransform: " + doodleTransform);
  //    ctx.stroke();

  //console.log("_points.length :" + _points.length);

  //  redrawPreview();
  renderToImageDataPreview();
}

function prevent(e) {
  e.preventDefault();
}





