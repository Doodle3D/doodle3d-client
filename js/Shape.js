function drawCircle(x0,y0,r,res) {
  if (res==undefined) res = 50; //circle resolution
  beginShape();
  var step = Math.PI * 2.0 / res;
  for (var a=0; a<Math.PI*2; a+=step) {
    var x = Math.sin(a+Math.PI) * r + x0;
    var y = Math.cos(a+Math.PI) * r + y0;
    if (a==0) shapeMoveTo(x,y);
    else shapeLineTo(x,y);
  }

  //close shape
  var x = Math.sin(0+Math.PI) * r + x0;
  var y = Math.cos(0+Math.PI) * r + y0;
  shapeLineTo(x,y);
  
  endShape();
}

function beginShape(x,y) {
  setSketchModified(true);
}

function shapeMoveTo(x,y) {
  _points.push([x, y, true]);
  adjustBounds(x, y);
  adjustPreviewTransformation();
  draw(x, y, .5);
}

function shapeLineTo(x,y) {
  _points.push([x, y, false]);
  adjustBounds(x, y);
  adjustPreviewTransformation();
  draw(x, y);
}

function endShape() {
  renderToImageDataPreview();
}

function getBounds(points) {    
  var xMin=9999,xMax=-9999,yMin=9999,yMax=-9999;
  for (var i=0; i<points.length; i++) {
    var p = points[i];
    xMin = Math.min(xMin,p[0]);
    xMax = Math.max(xMax,p[0]);
    yMin = Math.min(yMin,p[1]);
    yMax = Math.max(yMax,p[1]);
  }
  return {x:xMin,y:yMin,width:xMax-xMin,height:yMax-yMin};
}

function translatePoints(points,x,y) {
  for (var i=0; i<points.length; i++) {
    points[i][0] += x;
    points[i][1] += y;
  }
}

function scalePoints(points,x,y) {
  if (y==undefined) y = x;
  for (var i=0; i<points.length; i++) {
    points[i][0] *= x;
    points[i][1] *= y;
  }
}

function rotatePoints(points, radians, cx, cy) {
  if (cx==undefined) cx = 0;
  if (cy==undefined) cy = 0;

  var cos = Math.cos(radians);
  var sin = Math.sin(radians);

  for (var i=0; i<points.length; i++) {
      var x = points[i][0];
      var y = points[i][1];
      var nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
      var ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
      points[i][0] = nx;
      points[i][1] = ny;
  }
}

function moveShape(x,y) {
	var bounds = getBounds(_points);
	var delta = clipDeltaToCanvas(x, y, bounds);
	
	if (delta.x != 0 || delta.y != 0) {
		translatePoints(_points, delta.x, delta.y);
		updateView();
	}
}

//TODO: bounds should be cached and marked dirty on modification of points array
//TODO: reduction of zoomValue is still not completely correct (but acceptable?)
function zoomShape(zoomValue) {
	var bounds = getBounds(_points);
	var zw = bounds.width * zoomValue; zh = bounds.height * zoomValue;
	var newBounds = { x: bounds.x - (zw - bounds.width) / 2, y: bounds.y - (zh - bounds.height) / 2, width: zw, height: zh };

//	console.log("bounds: " + bounds.x + ", " + bounds.y + ", " + bounds.width + ", " + bounds.height);
//	console.log("newBounds: " + newBounds.x + ", " + newBounds.y + ", " + newBounds.width + ", " + newBounds.height);
	
	var ldx = Math.max(0, -newBounds.x);
	var rdx = Math.min(0, canvasWidth - (newBounds.x + newBounds.width));
	var tdy = Math.max(0, -newBounds.y);
	var bdy = Math.min(0, canvasHeight - (newBounds.y + newBounds.height));
	
	var delta = { x: ldx + rdx, y: tdy + bdy };
	if (ldx != 0 && rdx != 0) delta.x /= 2;
	if (tdy != 0 && bdy != 0) delta.y /= 2;
	
	delta.x /= zoomValue;
	delta.y /= zoomValue;

	var zxMax = Math.min(zoomValue, canvasWidth / newBounds.width);
	var zyMax = Math.min(zoomValue, canvasHeight / newBounds.height);
	var oldZV = zoomValue;
	var dir = zoomValue >= 1.0 ? 1 : 0;
	zoomValue = Math.min(zxMax, zyMax);
	if (dir == 1 && zoomValue < 1.0) zoomValue = 1;
	console.log("orgZV, zxMax, zyMax, finZV: " + oldZV + ", " + zxMax + ", " + zyMax + ", " + zoomValue);

	translatePoints(_points, delta.x, delta.y); //move points towards center as far as necessary to avoid clipping
	translatePoints(_points,-bounds.x,-bounds.y);
	translatePoints(_points,-bounds.width/2,-bounds.height/2);
	scalePoints(_points,zoomValue,zoomValue);
	translatePoints(_points,bounds.width/2,bounds.height/2);
	translatePoints(_points,bounds.x,bounds.y);
	updateView();
}

function rotateShape(radians) {
  var bounds = getBounds(_points);
  var cx = bounds.x + bounds.width/2;
  var cy = bounds.y + bounds.height/2;
  rotatePoints(_points, radians, cx, cy);
  updateView();
}

function updateView() {
  setSketchModified(true);
  redrawDoodle();
  adjustPreviewTransformation();
  renderToImageDataPreview();
  
  if (debugMode) {
    var bounds = getBounds(_points);
  	drawCircleTemp(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, 5, 'red');
  }
}

//returns (dx,dy) updated such that it moving bounds by that amount still fits inside canvas
//if dx,dy == 0,0, it is assumed that bounds do not fit to begin with, so a delta is returned to minimize clipping on all sides (for zooming)
function clipDeltaToCanvas(dx, dy, bounds) {
	dx = Math.max(dx, -bounds.x);
	dx = Math.min(dx, canvasWidth - (bounds.x + bounds.width));
	dy = Math.max(dy, -bounds.y);
	dy = Math.min(dy, canvasHeight - (bounds.y + bounds.height));
	return { x: dx, y: dy };
}

//*draws* a circle (i.e. it is not added as points to shape)
function drawCircleTemp(x, y, r, color) {
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.fillStyle = color;
	ctx.arc(x, y, r, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = 'black';
}
