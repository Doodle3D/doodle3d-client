var gcodeStart = [];
gcodeStart.push("G21 (mm)");
gcodeStart.push("G91 (relative)");
gcodeStart.push("G28 X0 Y0 Z0 (physical home)");
gcodeStart.push("G1 E10 F250 (flow)");
gcodeStart.push("G92 X-100 Y-100 Z0 E10");
gcodeStart.push("G1 Z3 F5000 (prevent diagonal line)");
gcodeStart.push("G90 (absolute)");
gcodeStart.push("M106 (fan on)");

var gcodeEnd= [];
gcodeEnd.push("G1 X-100 Y-100 F15000 (fast homing)");
gcodeEnd.push("M107");
gcodeEnd.push("M84 (disable axes)");

var gcode = [];
function generate_gcode(callback) {
  console.log("f:generategcode()");

  gcode = [];

  objectHeight = Math.ceil(numLayers / 5); // in settings objectHeight = 20, in previewRendering_v01.js numLayers is 100, hence the / 5
  objectHeight = numLayers; // in settings objectHeight = 20, in previewRendering_v01.js numLayers is 100, hence the / 5

  // todo hier een array van PATHS maken wat de losse paths zijn

  // copy array without reference -> http://stackoverflow.com/questions/9885821/copying-of-an-array-of-objects-to-another-array-without-object-reference-in-java
  var points = JSON.parse(JSON.stringify(_points));
  console.log("f:generategcode() >> points.length: " + points.length);

//  console.log("f:generategcode() >> paths: " + paths.toString());
//  console.log("paths.toString(): " + paths.toString());
//  return;


  // add gcode begin commands
  gcode = gcode.concat(gcodeStart);
 
  console.log("printer temperature: ",settings["printer.temperature"]);
  
  gcode.push("M104 S" + settings["printer.temperature"] + " (temperature)");
  gcode.push("M109 S" + settings["printer.temperature"] + " (wait for heating)");

  var layers = maxObjectHeight / settings["printer.layerHeight"]; //maxObjectHeight instead of objectHeight
  var extruder = 0.0;
  var prev = new Point(); prev.set(0, 0);

  // vervanger voor ofxGetCenterofMass
  var centerOfDoodle = {
    x: doodleBounds[0] + (doodleBounds[2]- doodleBounds[0])/2,
    y: doodleBounds[1] + (doodleBounds[3] - doodleBounds[1])/2
//    x: doodleBounds[0],
//    y: doodleBounds[1]
  }

  console.log("f:generategcode() >> layers: " + layers);
  for (var layer = 0; layer < layers; layer++) {

    var p = JSON.parse(JSON.stringify(points)); // [].concat(points);

    if (p.length < 2) return;
    var even = (layer % 2 == 0);
    var progress = layer / layers;

    // float layerScale = scaleFunction(float(layer)/layers); // scaleFactor van de layer -> lookup naar vfunc[] voor die scaleVals
    var layerScale = 1.0;

    // if begin point this row and end point last row are close enough, isLoop is true
    var isLoop = lineLength(points[0][0], points[0][1], points[points.length-1][0], points[points.length-1][1]) < 3;

    // set center of doodle as middle (ie subtract to that)
    pointsTranslate(p, -centerOfDoodle.x, -centerOfDoodle.y);
    pointsScale(p, screenToMillimeterScale,-screenToMillimeterScale);
    pointsScale(p, layerScale, layerScale);

    // sort-of in de buurt van (360/2.5)
    // // -> aight.. er zijn 750 lines vs 1000 in de d3d app. 135 = .75 * 180... dit kan je nog rechttrekken als je NET wat slimmer nadenkt :)
    // update: NEE, het is niet .75 * 180 want 135 was niet de beste value. //TODO dus.
    pointsRotate(p, rStep * progress * 139);

    if (layer == 0) {
      gcode.push("M107"); //fan off
      if (firstLayerSlow) gcode.push("M220 S40"); //slow speed
    } else if (layer == 2) { ////////LET OP
      gcode.push("M106");      //fan on
      gcode.push("M220 S100"); //normal speed
    }

    var curLayerCommand = 0;
    var totalLayerCommands = p.length;

    var paths = [];
    var pathCounter = -1;
    //  var points = [];

    for (var i = 0; i < p.length; i++) {
      if (p[i][2] == true) {
        pathCounter++;
        paths.push([]);
        paths[pathCounter].push([p[i][0], p[i][1]]);
      } else {
        paths[pathCounter].push([p[i][0], p[i][1]]);
      }
    }
//    console.log("f:generategcode() >> paths.length: " + paths.length);
    
    // loop over the subpaths (the separately drawn lines)
    for (var j = 0; j < paths.length; j++) {
      // this line is probably for drawing efficiency, alternating going from 0->end and end->0 (i.e. to and fro)
//      vector<ofSubPath::Command> &commands = subpaths[even ? j : subpaths.size()-1-j].getCommands();
      var commands = paths[j];

      // loop over the coordinates of the subpath
      for (var i = 0; i < commands.length; i++) {
        var last = commands.length - 1;

        // this line is probably for drawing efficiency, alternating going from 0->end and end->0 (i.e. to and fro)
//        ofPoint to = commands[(even || isLoop || loopAlways) ? i : last-i].to;
        var to = new Point(); to.set(commands[i][0], commands[i][1]);
        var sublayer = (layer == 0) ? 0.0 : layer + (useSubLayers ? (curLayerCommand/totalLayerCommands) : 0);
        var z = (sublayer + 1) * settings["printer.layerHeight"] + zOffset;

        var isTraveling = !isLoop && i==0;
        var doRetract = prev.distance(to) > retractionminDistance;
        
        if (enableTraveling && isTraveling) {
//          console.log("enableTraveling && isTraveling >> doRetract: " + doRetract + ", retractionspeed: " + retractionspeed);
          if (doRetract) gcode.push("G1 E" + (extruder - retractionamount).toFixed(3) + " F" + (retractionspeed * 60).toFixed(3));
          gcode.push("G1 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + (z + (doRetract ? hop : 0)).toFixed(3) + " F" + (travelSpeed * 60).toFixed(3));
          if (doRetract) gcode.push("G1 E" + extruder.toFixed(3) + " F" + (retractionspeed * 60).toFixed(3));
        } else {
//          console.log("       else");
          extruder += prev.distance(to) * settings["printer.wallThickness"] * settings["printer.layerHeight"] / filamentThickness;
          gcode.push("G1 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + z.toFixed(3) + " F" + (speed * 60).toFixed(3) + " E" + extruder.toFixed(3));
        }

        curLayerCommand++;
        prev = to;

      }

    }

    if ((layer/layers) > (objectHeight/maxObjectHeight)) {
      console.log("f:generategcode() >> (layer/layers) > (objectHeight/maxObjectHeight) is true -> breaking");
      break;
    }


  }

  // add gcode end commands
  gcode = gcode.concat(gcodeEnd);

  // debug
//  var _gc = gc.join("\n");
//  console.log("f:generategcode() >> _gc = " + _gc);

  // Return the gcode array, joined to one string with '\n' (line break) as the join parameter
  // This should result in a nice long string with line breaks
  if (callback == undefined) {
	  return gcode;
  } else {
    // post
  }
}

pointsTranslate = function(p, x, y) {
  for (var i = 0; i < p.length; i++) {
    p[i][0] += x;
    p[i][1] += y;
  }
}

pointsScale = function(p, sx, sy) {
  for (var i = 0; i < p.length; i++) {
    p[i][0] *= sx;
    p[i][1] *= sy;
  }
}

// rotates around point 0,0 (origin).
// Not the prettiest kind of rotation solution but in our case we're assuming that the points have just been translated to origin
pointsRotate = function(p, ang) {
  var _ang, dist;
  for (var i = 0; i < p.length; i++) {
    dist = Math.sqrt(p[i][0] * p[i][0] + p[i][1] * p[i][1]);
    _ang = Math.atan2(p[i][1], p[i][0]);
    p[i][0] = Math.cos(_ang + ang) * dist;
    p[i][1] = Math.sin(_ang + ang) * dist;
  }
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/line-length [rev. #1]
lineLength = function(x, y, x0, y0){
  return Math.sqrt((x -= x0) * x + (y -= y0) * y);
};

var Point = function() {};
Point.prototype = {
  x: 0,
  y: 0,
  set: function(_x, _y) {
    this.x = _x;
    this.y = _y;
  },
  distance: function(p) {
    var d = -1;
    if (p instanceof Point) {
      d = Math.sqrt((p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y));
    }
    return d;
  },
  toString: function() {
    console.log("x:" + this.x + ", y:" + this.y);
  }
}