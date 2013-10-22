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

/* * * * * * * * * *
 *
 *  INIT
 *
 * * * * * * * * * */
function initDoodleDrawing() {
  console.log("f:initDoodleDrawing()");

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

  console.log("drawCanvasTopLeftCoords: " + drawCanvasTopLeftCoords);
//  drawCanvasTopLeftCoords[0] = drawCanvas.css("left").match(/[0-9]/g).join("");
//  drawCanvasTopLeftCoords[1] = drawCanvas.css("top").match(/[0-9]/g).join("");
  drawCanvasTopLeftCoords[0] = drawCanvas.offset().left;
  drawCanvasTopLeftCoords[1] = drawCanvas.offset().top;
//  drawCanvasTopLeftCoords[0] = drawCanvas[0].offsetParent.offsetLeft;
//  drawCanvasTopLeftCoords[1] = drawCanvas[0].offsetParent.offsetTop;

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

  dragging = false;

  clearMainView();
  resetPreview();
  resetVerticalShapes();
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
      console.log("f:adjustBounds("+x+","+y+")");

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
  //  console.log("onmousedown >> e.offsetX,e.offsetY = " + e.offsetX+","+e.offsetY);
  //  console.log("onmousedown >> e.layerX,e.layerY= " + e.layerX+","+e.layerY);
  //  console.log("onmousedown >> e: " + e);
  //  console.log(e);
//  console.log("f:onCanvasMouseDown()");
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

function loadFromSvg(svgData) {
	var mode = '', x = 0, y = 0;

	console.log("loading " + svgData.length + " bytes of data...");

	clearDoodle();

	var p = svgData.indexOf("<path");
	if (p == -1) { console.log("loadFromSvg: could not find parsing start point"); return false; }
	p = svgData.indexOf('d="', p);
	if (p == -1) { console.log("loadFromSvg: could not find parsing start point"); return false; }
	p += 3; //skip 'd="'

	var skipSpace = function() { while (svgData.charAt(p) == ' ') p++; }
	var parseCommand = function() {
		while (true) {
			skipSpace();
			var c = svgData.charAt(p);
			if (c == 'M' || c == 'm' || c == 'l') { //new command letter
				mode = c;
			} else if (c == '"') { //end of command chain
				return true;
			} else { //something else, must be a pair of coordinates...
				var tx = 0, ty = 0, numberEnd = 0, len = 0;
				numberEnd = svgData.indexOf(',', p);
				if (numberEnd == -1) { console.log("could not find comma in coordinate pair"); return false; }
				len = numberEnd - p;
				tx = parseInt(svgData.substr(p, len));
				p += len + 1;
				skipSpace();
				numberEnd = svgData.indexOf(' ', p);
				if (numberEnd == -1) { console.log("could not find space after coordinate pair"); return false; }
				len = numberEnd - p;
				ty = parseInt(svgData.substr(p, len));
				p += len;

				if (mode == 'M' || mode == 'L') {
					x = tx; y = ty;
				} else if (mode == 'm' || mode == 'l') {
					x += tx; y += ty;
				} else {
					console.log("loadFromSvg: found coordinate pair but mode was never set");
					return false;
				}

				var isMove = mode == 'm' || mode == 'M';

				//TODO: create function for adding a point?
				//console.log("inserting "+x+","+y+" ",isMove);
				updatePrevX = x;
				updatePrevY = y;
				_points.push([x, y, isMove]);
				adjustBounds(x, y);
				adjustPreviewTransformation();

				if (isMove) draw(x, y, .5);
				else draw(x, y);
			}
			p++;
		}

		return true;
	};

	parseCommand(); //depends on value of p, so don't move this without taking that into consideration

	//find <!--d3d-keys
	//loop until invalid character found (namely the '-' of '-->'): skipSpace(); parse '(\w+):\w*(\w+)'; assign corresp. var if key matches

	renderToImageDataPreview();

	/* TODO: behaviour for prev/next buttons:
	 * - call update/status once to init number of saved sketches - 0 means both buttons disabled, otherwise set current to -1, total amount to number and enable left (i.e. clicking that loads last saved sketch)
	 * - when going back and forth, update current and enable/disable both buttons when borders (i.e. 1 and total amount) are reached
	 * - when saving, set current to -1 again and update total amount
	 */

	return true;
}

function saveToSvg() {
	var lastX = 0, lastY = 0, lastIsMove;
	var svg = '';

	var boundsWidth = doodleBounds[2] - doodleBounds[0];
	var boundsHeight = doodleBounds[3] - doodleBounds[1];

	svg += '<?xml version="1.0" standalone="no"?>\n';
	svg += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
	svg += '<svg width="' + boundsWidth + '" height="' + boundsHeight + '" version="1.1" xmlns="http://www.w3.org/2000/svg">\n';
	svg += '\t<desc>Doodle 3D sketch</desc>\n';

	var data = '';
	for (var i = 0; i < _points.length; ++i) {
		var x = _points[i][0], y = _points[i][1], isMove = _points[i][2];
		var dx = x - lastX, dy = y - lastY;

		if (i == 0)
			data += 'M'; //emit absolute move on first pair of coordinates
		else if (isMove != lastIsMove)
			data += isMove ? 'm' : 'l';

		data += dx + ',' + dy + ' ';

		lastX = x;
		lastY = y;
		lastIsMove = isMove;
	}

	svg += '\t<path transform="translate(' + -doodleBounds[0] + ',' + -doodleBounds[1] + ')" d="' + data + '" fill="none" stroke="black" stroke-width="2" />\n';

	var makeField = function(k,v) { return k + ': ' + v + '; '; }
	svg += '<!--d3d-keys ' + makeField('height', numLayers) + makeField('outlineShape', VERTICALSHAPE) + makeField('twist', rStep) + '-->\n';

	svg += '</svg>\n';

	return svg;
}

var prevPoint = {x:-1, y:-1};
function onCanvasMouseMove(e) {
//  console.log("f:onCanvasMouseMove()");
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
//  console.log("f:onCanvasMouseUp()");
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
  console.log("f:onCanvasTouchDown >> e: " , e);
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
  e.preventDefault();
//  var x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
//  var y = e.touches[0].pageY - e.touches[0].target.offsetTop;
    var x = e.touches[0].pageX - drawCanvasTopLeftCoords[0];
    var y = e.touches[0].pageY - drawCanvasTopLeftCoords[1];
//    var x = e.touches[0].layerX;
//    var y = e.touches[0].layerY;
//  var x = e.touches[0].layerX;
//  var y = e.touches[0].layerY;

  console.log("f:onCanvasTouchMove >> x,y = "+x+","+y+" , e: " , e);

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
