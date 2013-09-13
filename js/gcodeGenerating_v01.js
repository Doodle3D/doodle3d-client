var gcodeStart = [];
gcodeStart.push(";Generated with Doodle3D");
gcodeStart.push("G21"); 						// metric values
gcodeStart.push("G91"); 						// relative positioning
gcodeStart.push("M107"); 						// start with the fan off
gcodeStart.push("G28 X0 Y0"); 			// move X/Y to min endstops
gcodeStart.push("G28 Z0"); 					// move Z to min endstops
gcodeStart.push("G1 Z15 F9000"); 		// move the platform down 15mm
gcodeStart.push("G92 E0"); 					// zero the extruded length
gcodeStart.push("G1 F200 E10");			// extrude 10mm of feed stock
gcodeStart.push("G92 E0");					// zero the extruded length again
gcodeStart.push("G92 X-100 Y-100 E0"); // zero the extruded length again and make center the start position
gcodeStart.push("G1 F9000");				
gcodeStart.push("G90"); 						// absolute positioning
gcodeStart.push("M117 Printing Doodle...  ");	// display message (20 characters to clear whole screen)

var gcodeEnd= [];
gcodeEnd.push("M107"); 							// fan off
gcodeEnd.push("G91"); 							// relative positioning
gcodeEnd.push("G1 E-1 F300"); 			// retract the filament a bit before lifting the nozzle, to release some of the pressure
gcodeEnd.push("G1 Z+0.5 E-5 X-20 Y-20 F9000"); // move Z up a bit and retract filament even more
gcodeEnd.push("G28 X0 Y0"); 				// move X/Y to min endstops, so the head is out of the way
gcodeEnd.push("M84"); 							// disable axes / steppers
gcodeEnd.push("G90"); 							// absolute positioning
gcodeEnd.push("M117 Done                ");	// display message (20 characters to clear whole screen)


var gcode = [];
function generate_gcode(callback) {
  console.log("f:generategcode()");

  var startGcode = [];
  var endGcode = [];

  // get gcode start statements
  if ($("#startgcode").val().trim().length != 0) {
    console.log("   found contents for start-gcode in settings.html")
    startGcode = $("#startgcode").val().trim().split("\n");
  } else {
    console.log("   no start-gcode in settings.html, using defaults")
    startGcode.concat(gcodeStart);
  }

  // get gcode end statements
  if ($("#endgcode").val().trim().length != 0) {
    console.log("   found contents for end-gcode in settings.html")
    endGcode = $("#endgcode").val().trim().split("\n");
  } else {
    console.log("   no end-gcode in settings.html, using defaults")
    endGcode.concat(gcodeEnd);
  }

  gcode = [];

  console.log("settings: ",settings);
  var speed 						      = settings["printer.speed"]
  var normalSpeed 			      = speed;
  var bottomSpeed 			      = speed*0.5;
  var travelSpeed 			      = settings["printer.travelSpeed"]
  var filamentThickness       = settings["printer.filamentThickness"];
  var wallThickness 		      = settings["printer.wallThickness"];
  var screenToMillimeterScale = isNaN(settings["printer.screenToMillimeterScale"]) ? 0.3 : settings["printer.screenToMillimeterScale"]; // TODO add this item to the settings on 'kastje'
  var layerHeight 			      = settings["printer.layerHeight"];
  var objectHeight		        = settings["printer.objectHeight"];
  var maxObjectHeight		      = isNaN(settings["printer.maxObjectHeight"]) ? 150 : settings["printer.maxObjectHeight"]; // TODO add this item to the settings on 'kastje'
  var temperature 			      = settings["printer.temperature"];
  var useSubLayers 			      = settings["printer.useSubLayers"];
  var enableTraveling 	      = isNaN(settings["printer.enableTraveling"]) ? true : settings["printer.enableTraveling"]; // TODO add this item to the settings on 'kastje'
  var retractionspeed 	      = settings["printer.retraction.speed"];
  var retractionminDistance   = settings["printer.retraction.minDistance"];
  var retractionamount 	      = settings["printer.retraction.amount"];

  /*
  console.log("f:generate_gcode >> EFFE CHECKEN:");
  console.log("   speed: " + speed);
  console.log("   travelSpeed: " + travelSpeed);
  console.log("   filamentThickness: " + filamentThickness);
  console.log("   wallThickness: " + wallThickness);
  console.log("   screenToMillimeterScale: " + screenToMillimeterScale);
  console.log("   layerHeight: " + layerHeight);
  console.log("   objectHeight: " + objectHeight);
  console.log("   maxObjectHeight: " + maxObjectHeight);
  console.log("   temperature: " + temperature);
  console.log("   maxObjectHeight: " + maxObjectHeight);
  console.log("   useSubLayers: " + useSubLayers);
  console.log("   enableTraveling: " + enableTraveling);
  console.log("   retractionspeed: " + retractionspeed);
  console.log("   retractionminDistance: " + retractionminDistance);
  console.log("   retractionamount: " + retractionamount);
  console.log("");
  //*/

  objectHeight = Math.ceil(numLayers / 5); // in settings objectHeight = 20, in previewRendering_v01.js numLayers is 100, hence the / 5
  objectHeight = numLayers; // in settings objectHeight = 20, in previewRendering_v01.js numLayers is 100, hence the / 5

  // todo hier een array van PATHS maken wat de losse paths zijn

  // copy array without reference -> http://stackoverflow.com/questions/9885821/copying-of-an-array-of-objects-to-another-array-without-object-reference-in-java
  var points = JSON.parse(JSON.stringify(_points));
  console.log("f:generategcode() >> points.length: " + points.length);

//  console.log("f:generategcode() >> paths: " + paths.toString());
//  console.log("paths.toString(): " + paths.toString());
//  return;

  console.log("printer temperature: ",temperature);
	gcode.push("M109 S" + temperature); // set target temperature and wait for the extruder to reach it
  // add gcode begin commands
  gcode = gcode.concat(startGcode);
	
  //gcode.push("M109 S" + temperature); // set target temperature and wait for the extruder to reach it

  var layers = maxObjectHeight / layerHeight; //maxObjectHeight instead of objectHeight
  var extruder = 0.0;
  var prev = new Point(); prev.set(0, 0);

  // replacement (and improvement) for ofxGetCenterofMass
  var centerOfDoodle = {
    x: doodleBounds[0] + (doodleBounds[2]- doodleBounds[0])/2,
    y: doodleBounds[1] + (doodleBounds[3] - doodleBounds[1])/2
//    x: doodleBounds[0],
//    y: doodleBounds[1]
  }

  console.log("f:generategcode() >> layers: " + layers);
  if (layers == Infinity) return;

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
      //gcode.push("M107"); //fan off
      if (firstLayerSlow) {
	      //gcode.push("M220 S20"); //slow speed
	      speed = bottomSpeed;
			  //console.log("> speed: ",speed);
      }
    } else if (layer == 2) { ////////LET OP, pas bij layer 2 weer op normale snelheid ipv layer 1
      gcode.push("M106");      //fan on
      //gcode.push("M220 S100"); //normal speed
      speed = normalSpeed;
  	  //console.log("> speed: ",speed);
    }

    var curLayerCommand = 0;
    var totalLayerCommands = p.length;
    var layerProgress = 0;

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
    for (var j = 0; j < paths.length; j++) { // TODO paths > subpaths
      // this line is probably for drawing efficiency, alternating going from 0->end and end->0 (i.e. to and fro)
//      vector<ofSubPath::Command> &commands = subpaths[even ? j : subpaths.size()-1-j].getCommands();
      var commands = paths[j]; //commands zijn alle points uit subpath j // TODO commands > subpathPoints

      // loop over the coordinates of the subpath
      for (var i = 0; i < commands.length; i++) {
        var last = commands.length - 1;

        // this line is probably for drawing efficiency, alternating going from 0->end and end->0 (i.e. to and fro)
//        ofPoint to = commands[(even || isLoop || loopAlways) ? i : last-i].to;
        var to = new Point(); to.set(commands[i][0], commands[i][1]);
        var sublayer = (layer == 0) ? 0.0 : layer + (useSubLayers ? (curLayerCommand/totalLayerCommands) : 0);
        var z = (sublayer + 1) * layerHeight; // 2013-09-06 removed zOffset (seemed to be useless)

        var isTraveling = !isLoop && i==0;
        var doRetract = prev.distance(to) > retractionminDistance;

        if (enableTraveling && isTraveling) {
//          console.log("enableTraveling && isTraveling >> doRetract: " + doRetract + ", retractionspeed: " + retractionspeed);
          if (doRetract) gcode.push("G0 E" + (extruder - retractionamount).toFixed(3) + " F" + (retractionspeed * 60).toFixed(3)); //retract
          gcode.push("G0 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + z.toFixed(3) + " F" + (travelSpeed * 60).toFixed(3));
          if (doRetract) gcode.push("G0 E" + extruder.toFixed(3) + " F" + (retractionspeed * 60).toFixed(3)); // return to normal 
        } else {
//          console.log("       else");
          extruder += prev.distance(to) * wallThickness * layerHeight / filamentThickness;
          gcode.push("G1 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + z.toFixed(3) + " F" + (speed * 60).toFixed(3) + " E" + extruder.toFixed(3));
        }

        curLayerCommand++;
        layerProgress = curLayerCommand/totalLayerCommands;
        prev = to;

      }

    }

    if ((layer/layers) > (objectHeight/maxObjectHeight)) {
      console.log("f:generategcode() >> (layer/layers) > (objectHeight/maxObjectHeight) is true -> breaking at layer " + (layer + 1));
      break;
    }


  }

  // add gcode end commands
  gcode = gcode.concat(endGcode);

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