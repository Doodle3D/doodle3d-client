function drawCircle(x0,y0,r,res) {
  if (res==undefined) res = 50; //circle resolution
  beginShape();
  var step=Math.PI * 2.0 / res;
  for (var a=0; a<=Math.PI*2; a+=step) {
    var x = Math.sin(a) * r + x0;
    var y = Math.cos(a) * r + y0;
    if (a==0) shapeMoveTo(x,y);
    else shapeLineTo(x,y);
  }
  endShape();
}

function beginShape(x,y) {
  setSketchModified(true);
}

function shapeMoveTo(x,y) {
  _points.push([x, y, true]);
  adjustBounds(x, y)
  adjustPreviewTransformation();
  draw(x, y, .5);
}

function shapeLineTo(x,y) {
  _points.push([x, y, false]);
  adjustBounds(x, y)
  adjustPreviewTransformation();
  draw(x, y);
}

function endShape() {
  renderToImageDataPreview();
}