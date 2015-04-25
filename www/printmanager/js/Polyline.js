var Polyline = function(x,y) {
  var className = "Polyline";
  var points = [new Point(x,y)];

  function translate(x,y) {
    for (var i = 0; i < points.length; i++) {
      points[i].x += x;
      points[i].y += y;
    }
  }

  function rotate(degrees) {
    console.log('rotate: to be implemented')
  }

  function scale(scale) {
    for (var i = 0; i < points.length; i++) {
      points[i].x *= scale;
      points[i].y *= scale;
    }
  }

  function addVertex(x,y) {
    var p = new Point(x,y);
    points.push(p);
  }

  function getBoundingBox() {
    var box = new Rectangle(0,0,0,0);
    for (var i=0; i<points.length; i++) {
      if (i==0) box.set(points[i].x,points[i].y,0,0);
      else box.growToIncludePoint(points[i]);
    }
    return box;
  }

  function getWidth() {
    return getBoundingBox().getWidth();
  }

  function getHeight() {
    return getBoundingBox().getHeight();
  }

  function getPoints() {
    return points;
  }

  function getPerimeter() {
    var len = 0;
    for (var i = 1; i < points.length; i++) {
      len += points[i-1].distance(points[i]);
    }
    return len;
  }

  function clone() {
    var p = new Polyline(points[0].x,points[0].y);
    for (var i=1; i<points.length; i++) {
      p.getPoints().push(new Point(points[i].x, points[i].y));
    }
    return p;
  }

  function toString() {
    return points.join(", ");
  }


  return {
    translate: translate,
    rotate: rotate,
    scale: scale,
    addVertex: addVertex,
    getBoundingBox: getBoundingBox,
    getPerimeter: getPerimeter,
    getWidth: getWidth,
    getHeight: getHeight,
    getPoints: getPoints,
    clone: clone,
    toString: toString,
  }

}