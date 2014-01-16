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
  translatePoints(_points,x,y);
  updateView();
}

function zoomShape(zoomValue) {
  var bounds = getBounds(_points);
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
}