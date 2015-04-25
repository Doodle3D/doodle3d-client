var Point = function(x,y) {
  if (x===undefined) x = 0;
  if (y===undefined) y = 0;

  if (isNaN(x) || isNaN(y)) {
    console.warning("Point x or y isNaN: ",x,y);
  }

  this.x = x;
  this.y = y;
}

// Point.prototype.clone = function() { //not used since it easy to clone a point using 'new Point(org.x,org.y)'
//   return new Point(this.x, this.y);
// }

Point.prototype.distance = function(p) {
  var x1 = this.x;
  var y1 = this.y;
  var x2 = p.x;
  var y2 = p.y;
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

Point.prototype.rotate = function(radians,pivot) {
  if (pivot===undefined) pivot = new Point(0,0);
  var x = this.x;
  var y = this.y;
  var xrot = ((x-pivot.x)*Math.cos(radians) - (y-pivot.y)*Math.sin(radians)) + pivot.x;
  this.y = ((x-pivot.x)*Math.sin(radians) + (y-pivot.y)*Math.cos(radians)) + pivot.y;
  this.x = xrot;
}


Point.prototype.toString = function(p) {
  return this.x.toFixed(2) + "," + this.y.toFixed(2);
}
