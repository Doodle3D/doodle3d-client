var Rectangle = function(_x,_y,_w,_h) {
  
  var x,y,w,h;

  set(_x,_y,_w,_h);

  function set(_x,_y,_w,_h) {
    x = _x;
    y = _y;
    w = _w;
    h = _h;
  }

  function growToIncludeRectangle(rect) {
    growToIncludePoint(new Point(rect.getMinX(),rect.getMinY()));
    growToIncludePoint(new Point(rect.getMaxX(),rect.getMaxY()));
  }

  function growToIncludePoint(p) {
    var x0 = Math.min(getMinX(),p.x);
    var x1 = Math.max(getMaxX(),p.x);
    var y0 = Math.min(getMinY(),p.y);
    var y1 = Math.max(getMaxY(),p.y);
    var w = x1 - x0;
    var h = y1 - y0;
    set(x0,y0,w,h);
  }

  function getCenter() { 
    var cx = (getMaxX()-getMinX()) / 2;
    var cy = (getMaxY()-getMinY()) / 2;
    return new Point(cx,cy);
  }

  function getX() { return x; }
  function getY() { return y; }
  function getWidth()  { return w; }
  function getHeight() { return h; }
  function getMinX() { return Math.min(x, x + w); }
  function getMaxX() { return Math.max(x, x + w); }
  function getMinY() { return Math.min(y, y + h); }
  function getMaxY() { return Math.max(y, y + h); }

  function toString() {
    return 'x:' + x + ", y:" + y + ", w:" + w + ", h:" + h;
  }

  return {
    getMinX: getMinX,
    getMaxX: getMaxX,
    getMinY: getMinY,
    getMaxY: getMaxY,
    getWidth: getWidth,
    getHeight: getHeight,
    set: set,
    growToIncludeRectangle: growToIncludeRectangle,
    growToIncludePoint: growToIncludePoint,
    toString: toString,
    getX: getX,
    getY: getY,
    getCenter: getCenter,
  }
  
}