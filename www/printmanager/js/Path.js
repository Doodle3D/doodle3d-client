var Path = function() {
  var className = "Path";
  var polylines = [];

  function translate(x,y) {
    for (var i = 0; i < polylines.length; i++) {
      polylines[i].translate(x,y);
    }
  }

  function rotate(radians,pivot) {
    for (var i = 0; i < polylines.length; i++) {
      var points = polylines[i].getPoints();
      for (var j = 0; j < points.length; j++) {
        points[j].rotate(radians,pivot)
      }
    }
  }

  function scale(scale) {
    for (var i = 0; i < polylines.length; i++) {
      // console.log(className,'scale',scale);
      polylines[i].scale(scale);
    }
  }

  function moveTo(x,y) {
    polylines.push(new Polyline(x,y));
  }

  function lineTo(x,y) {
    if (polylines.length==0) moveTo(x,y);
    else polylines[polylines.length-1].addVertex(x,y);
  }

  function getBoundingBox() {
    var box = new Rectangle(0,0,0,0);
    for (var i = 0; i < polylines.length; i++) {
      if (i==0) box = polylines[i].getBoundingBox();
      else box.growToIncludeRectangle(polylines[i].getBoundingBox());
    }
    return box;
  }

  function getWidth() {
    return this.getBoundingBox().getWidth();
  }

  function getHeight() {
    return this.getBoundingBox().getHeight();
  }

  function getPolylines() {
    return polylines;
  }

  function setPolylines(_polylines) {
    polylines = _polylines;
  }

  function clone() {
    var p = new Path();
    for (var i=0; i<polylines.length; i++) {
      // console.log(className,'clone poly#',i,"/",polylines.length,polylines[i].toString(),"||||",polylines[i].clone().toString());
      p.getPolylines().push(polylines[i].clone());
    }
    // console.log(className,'p.toString()',p.toString());
    return p;
  }

  function alignCorner() {
    var box = getBoundingBox();
    translate(-box.getX(),-box.getY());
  }

  function alignCenter() {
    var box = getBoundingBox();
    // console.log(className,'alignCenter',box.toString());
    translate(-box.getX(),-box.getY());
    translate(-box.getWidth()/2,-box.getHeight()/2);
  }

  function toString() {
    return polylines.join(" --- ");
  }

  return {
    translate: translate,
    rotate: rotate,
    scale: scale,
    moveTo: moveTo,
    lineTo: lineTo,
    getBoundingBox: getBoundingBox,
    getWidth: getWidth,
    getHeight: getHeight,
    getPolylines: getPolylines,
    setPolylines: setPolylines,
    clone: clone,
    alignCenter: alignCenter,
    alignCorner: alignCorner,
    toString: toString
  }

}