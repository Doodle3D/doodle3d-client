var Doodle2gcode = function() {
  var className = "Doodle2gcode";

  var speed = 50;
  var layerHeight = .2;
  var filamentDiameter = 2.89;
  var nozzleDiameter = .4;
  var dimensions = {x:200,y:200,z:200};
  var px2mm = .3;

  var nozzleFilamentRatio = nozzleDiameter / filamentDiameter;
  var layerNozzleRatio = layerHeight / nozzleDiameter;
  var extrudeFactor = nozzleFilamentRatio * layerNozzleRatio;
  var flowRatio = 1;

  var extruder = 0;

  function generate(doodles) {
    var gcode = "";
    extruder = 0;
    for (var z=0,layer=0; z<dimensions.z; z+=layerHeight,layer++) {
      for (var i=0; i<doodles.length; i++) {
        
        var path = getDoodlePathAtHeight(doodles[i],z);
        
        // var path = new Path();
        // path.moveTo(0,0);
        // path.lineTo(100,0);
        // path.lineTo(100,100);
        // path.lineTo(0,100);
        // path.lineTo(0,0);

        gcode += path2gcode(path,z);
      }
    }
    return gcode;
  }

  function getDoodlePathAtHeight(doodle,z) {
    if (z>doodle.getHeight()) return new Path(); //return empty path, doodle not visible in this slice
    var zz = z/doodle.getHeight(); //0..1
    var rotation = doodle.getRotation();
    var twist = zz * doodle.getTwist();
    var offset = doodle.getOffset();
    var scale = doodle.getScale();
    var scaler = doodle.getScaleFunction(zz);
    var path = doodle.getPath().clone();

    // var org = path.getOffset();
    var box = path.getBoundingBox();

    // console.log(box.toString());

    path.translate(-box.getX(),-box.getY());
    path.translate(-box.getWidth()/2,-box.getHeight()/2);

    // path.alignCenter();
    path.scale(scale);
    path.scale(scaler);

    path.translate(box.getX(),box.getY());
    path.translate(box.getWidth()/2,box.getHeight()/2);

    // path.rotate(rotation);
    path.rotate(twist,box.getCenter());
    // path.alignCorner();
    path.translate(offset.x,offset.y);

    return path;
  }

  function path2gcode(path,z) {
    var gcode = '';
    var polylines = path.getPolylines();

    path.scale(px2mm);
    path.translate(0,-dimensions.y);

    for (var i=0; i<polylines.length; i++) {
      var points = polylines[i].getPoints();
      for (var j=0; j<points.length; j++) {
        var x = points[j].x;
        var y = -points[j].y;

        gcode += (j==0 ? 'G0' : 'G1');
        gcode += ' ';
        gcode += 'X' + x.toFixed(2);
        gcode += ' ';
        gcode += 'Y' + y.toFixed(2);
        gcode += ' ';
        gcode += 'Z' + z.toFixed(2);
        gcode += ' ';

        if (j>0) {
          var dist = points[j-1].distance(points[j]) * px2mm;
          extruder += dist * extrudeFactor * flowRatio;
          gcode += 'E' + extruder.toFixed(4);
        }

        gcode += '\n';
      }
    }
    return gcode;
  }

  return {
    generate: generate,
  }
}