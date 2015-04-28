var Doodle2gcode = function() {
  var className = "Doodle2gcode";

  var speed = 100 * 60; //mm/min
  var travelSpeed = 150 * 60 //mm/min
  var retractionSpeed = 45 * 60 //mm/min
  var retractionAmount = 4.5;
  var layerHeight = .2;
  var filamentDiameter = 2.89;
  var nozzleDiameter = .4;
  var dimensions = {x:200,y:200,z:200};
  var px2mm = .3;
  var flow = 1;
  var filamentArea = Math.PI * (filamentDiameter/2)*(filamentDiameter/2);
  var extrusionPerMM = layerHeight / filamentArea * flow;

  // var nozzleFilamentRatio = nozzleDiameter / filamentDiameter;
  // var layerNozzleRatio = layerHeight / nozzleDiameter;
  // var extrudeFactor = nozzleFilamentRatio * layerNozzleRatio;
  // var flowRatio = 1;

  var extruder = 0;

  function generate(doodles) {
    var gcode = "";
    extruder = 0;
    for (var z=0,layer=0; z<dimensions.z; z+=layerHeight,layer++) {
      gcode += ';LAYER:' + layer + '\n';
      if (layer==0) gcode += 'M107\nM220 S50\n'; //fan off, print half speed
      else if (layer==1) gcode += 'M106 S255\nM220 S100\n' //fan on, print full speed
      for (var i=0; i<doodles.length; i++) {
        var path = getDoodlePathAtHeight(doodles[i],z);

        // console.log(path.getBoundingBox().toString());

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

    //center object on origin to apply transformations
    path.translate(-box.getX(),-box.getY());
    path.translate(-box.getWidth()/2,-box.getHeight()/2);

    path.scale(scale);
    path.scale(scaler);

    path.translate(box.getX(),box.getY());
    path.translate(box.getWidth()/2,box.getHeight()/2);

    // path.rotate(rotation);
    path.rotate(twist,box.getCenter());

    var scaledCenterX = box.getCenter().x * (1-(scale * scaler));
    var scaledCenterY = box.getCenter().y * (1-(scale * scaler));

    path.translate(offset.x - scaledCenterX, offset.y - scaledCenterY);

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

        //retract + travel + unretract
        if (j==0) {
          gcode += 'G0 F' + retractionSpeed + ' E' + (extruder-retractionAmount).toFixed(4) + '\n';
          gcode += 'G0 F' + travelSpeed + ' X' + x.toFixed(2) + ' Y' + y.toFixed(2) + ' Z' + z.toFixed(2) + '\n';
          gcode += 'G1 F' + retractionSpeed + ' E' + extruder.toFixed(4) + '\n';
        } else {
          gcode += 'G1 '; //gcode command
          if (j==1) gcode += 'F' + speed + ' '; //print speed
          gcode += 'X' + x.toFixed(2) + ' Y' + y.toFixed(2) + ' ';

          //extrude
          if (j>0) {
            var dist = points[j-1].distance(points[j]) * px2mm;
            extruder += dist * extrusionPerMM;
            gcode += 'E' + extruder.toFixed(4);
          }

          gcode += '\n';
        }

      }
    }
    return gcode;
  }

  return {
    generate: generate,
  }
}