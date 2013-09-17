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

var $canvas = $("#mycanvas");
var canvas = $("#mycanvas")[0];
var ctx = canvas.getContext('2d');

var canvasWidth = canvas.width;
var canvasHeight = canvas.height;

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

/* * * * * * * * * *
 *
 *  INIT
 *
 * * * * * * * * * */
function initDoodleDrawing() {
  console.log("f:initDoodleDrawing()");

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
    document.body.addEventListener('touchmove',prevent,false);
  }

  drawCanvas = $("#drawAreaContainer");

  console.log("drawCanvasTopLeftCoords: " + drawCanvasTopLeftCoords);
  drawCanvasTopLeftCoords[0] = drawCanvas.css("left").match(/[0-9]/g).join("");
  drawCanvasTopLeftCoords[1] = drawCanvas.css("top").match(/[0-9]/g).join("");

  console.log("f:initDoodleDrawing() >> canvasWidth: " + canvasWidth);
  console.log("f:initDoodleDrawing() >> canvasHeight: " + canvasHeight);

}

/* * * * * * * * * *
 *
 *  CANVAS DRAWING FUNCTION
 *
 * * * * * * * * * */
function draw(_x, _y, _width) {
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
  console.log("f:clearDoodle");

  _points = [];

  prevX = 0;
  prevY = 0;

  updatePrevX = -1;
  updatePrevY = -1;

  doodleBounds = [-1, -1, -1, -1]; // left, top, right, bottom
  doodleTransform = [0, 0, 1.0, 1.0]; // [ x, y, scaleX, scaleY ]

  clearMainView();
  resetPreview();
}

function redrawDoodle() {
  console.log("f:redrawDoodle()");

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

 function adjustBounds(x, y) {
  var newPointsOutsideOfCurrentBounds = false;
  //    console.log("f:adjustBounds("+x+","+y+")");

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
//  doodleBounds[0] = Math.min(doodleBounds[0], x); // left
//  doodleBounds[2] = Math.max(doodleBounds[2], x); // right
//
//  doodleBounds[1] = Math.min(doodleBounds[1], y); // top
//  doodleBounds[3] = Math.max(doodleBounds[3], y); // bottom

  // draw the bounding rect (DEBUG)
  /*
  ctx.beginPath();
  ctx.rect(doodleBounds[0],doodleBounds[1], doodleBounds[2] - doodleBounds[0], doodleBounds[3] - doodleBounds[1]);
  ctx.lineWidth = .2;
  ctx.strokeStyle = "#333"
  ctx.stroke();
  ctx.closePath();
  //*/

  //    console.log("   new bounds: " + doodleBounds);

   return newPointsOutsideOfCurrentBounds;
}

// does what exactly?
function adjustPreviewTransformation() {
  //    console.log("f:adjustPreviewTransformation()");

//  doodleTransform[0] = doodleBounds[0] - (doodleBounds[2] - doodleBounds[0]) / 2;
//  doodleTransform[1] = doodleBounds[1] - (doodleBounds[3] - doodleBounds[1]) / 2;
//  doodleTransform[0] = doodleBounds[0] - ((doodleBounds[2] - doodleBounds[0]) / 2);
//  doodleTransform[1] = doodleBounds[1] - ((doodleBounds[3] - doodleBounds[1]) / 2);
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
//  console.log("onmousedown");
//  console.log("onmousedown >> e.offsetX,e.offsetY = " + e.offsetX+","+e.offsetY);
//  console.log("onmousedown >> e.layerX,e.layerY= " + e.layerX+","+e.layerY);
//  console.log("onmousedown >> e: " + e);
//  console.log(e);
  dragging = true;

  prevCountingTime = new Date().getTime();
  movementCounter = 0

//  _points.push([e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, true]);
//  adjustBounds(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
//  adjustPreviewTransformation();
//  draw(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, 0.5);

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
  if (!dragging) return;
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
    var dist = Math.sqrt(Math.pow((prevPoint.x - x), 2) + Math.pow((prevPoint.y - y), 2));
    if (dist > 5) { // replace by setting: doodle3d.simplify.minDistance
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

  // DEBUG
//  $("#textdump").text("");
//  $("#textdump").append("doodlebounds:" + doodleBounds + "\n");
//  $("#textdump").append("doodletransform:" + doodleTransform + "\n");

  if (new Date().getTime() - prevRedrawTime > redrawInterval) {
    // redrawing the whole preview the first X points ensures that the doodleBounds is set well
    prevRedrawTime = new Date().getTime();
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
//      redrawPreview();
    }
  }
}
prevUpdateFullPreview = 0; // 0 is not a timeframe but refers to the _points array
prevUpdateFullPreviewInterval = 25; // refers to number of points, not a timeframe

function onCanvasMouseUp(e) {
  //    console.log("onmouseup");
  dragging = false;
  console.log("doodleBounds: " + doodleBounds);
  console.log("doodleTransform: " + doodleTransform);
  //    ctx.stroke();

  console.log("_points.length :" + _points.length);
//  console.log(_points);

  // DEBUG
//  $("#textdump").text("");
//  $("#textdump").append("doodlebounds:" + doodleBounds + "\n");
//  $("#textdump").append("doodletransform:" + doodleTransform + "\n");

//  redrawPreview();
  renderToImageDataPreview();
}

function onCanvasTouchDown(e) {
  e.preventDefault();
//  var x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
//  var y = e.touches[0].pageY - e.touches[0].target.offsetTop;
  var x = e.touches[0].pageX - drawCanvasTopLeftCoords[0];
  var y = e.touches[0].pageY - drawCanvasTopLeftCoords[1];

  _points.push([x, y, true]);
  adjustBounds(x, y);
  adjustPreviewTransformation();
  draw(x, y, .5);

  movementCounter = 0;

  prevRedrawTime = new Date().getTime();
}

function onCanvasTouchMove(e) {
  e.preventDefault();
//  var x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
//  var y = e.touches[0].pageY - e.touches[0].target.offsetTop;
    var x = e.touches[0].pageX - drawCanvasTopLeftCoords[0];
    var y = e.touches[0].pageY - drawCanvasTopLeftCoords[1];

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
  console.log("f:onCanvasTouchEnd()");
  console.log("doodleBounds: " + doodleBounds);
  console.log("doodleTransform: " + doodleTransform);
  //    ctx.stroke();

  console.log("_points.length :" + _points.length);

  //  redrawPreview();
  renderToImageDataPreview();
}

function prevent(e) {
  e.preventDefault();
}