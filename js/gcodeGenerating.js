/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var MAX_POINTS_TO_PRINT = 200000
var gcode = [];

function generate_gcode() {
  console.log("f:generategcode()");

  gcode = [];

  console.log("settings: ",settings);
  var speed 						      = settings["printer.speed"];
  var normalSpeed 			      = speed;
  var bottomSpeed 			      = settings["printer.bottomLayerSpeed"];
  var firstLayerSlow			  = settings["printer.firstLayerSlow"];
  var bottomFlowRate			  = settings["printer.bottomFlowRate"];
  var travelSpeed 			      = settings["printer.travelSpeed"]
  var filamentThickness       = settings["printer.filamentThickness"];
  var wallThickness 		      = settings["printer.wallThickness"];
  var screenToMillimeterScale = settings["printer.screenToMillimeterScale"];
  var layerHeight 			      = settings["printer.layerHeight"];
  var temperature 			      = settings["printer.temperature"];
  var bedTemperature 			    = settings["printer.bed.temperature"];
  var useSubLayers 			      = settings["printer.useSubLayers"];
  var enableTraveling 	      = settings["printer.enableTraveling"];
  var retractionEnabled 	    = settings["printer.retraction.enabled"];
  var retractionspeed 	      = settings["printer.retraction.speed"];
  var retractionminDistance   = settings["printer.retraction.minDistance"];
  var retractionamount 	      = settings["printer.retraction.amount"];
  var preheatTemperature      = settings["printer.heatup.temperature"];
  var preheatBedTemperature   = settings["printer.heatup.bed.temperature"];
  var printerDimensionsX   		= settings["printer.dimensions.x"];
  var printerDimensionsY      = settings["printer.dimensions.y"];
  var printerDimensionsZ      = settings["printer.dimensions.z"];

  var gCodeOffsetX = printerDimensionsX/2;
  var gCodeOffsetY = printerDimensionsY/2;

  var startCode = generateStartCode();
  var endCode = generateEndCode();

  // max amount of real world layers
  var layers = printerDimensionsZ / layerHeight; //maxObjectHeight instead of objectHeight

  // translate numLayers in preview to objectHeight in real world
  objectHeight = Math.round(numLayers/maxNumLayers*printerDimensionsZ);

  // translate preview rotation (per layer) to real world rotation
  var rStepGCode = rStep * maxNumLayers/layers; ///maxNumLayers*maxObjectHeight;
  
  // correct direction
  rStepGCode = -rStepGCode;

  // copy array without reference -> http://stackoverflow.com/questions/9885821/copying-of-an-array-of-objects-to-another-array-without-object-reference-in-java
  var points = JSON.parse(JSON.stringify(_points));

  // add gcode begin commands
  gcode = gcode.concat(startCode);

  var layers = printerDimensionsZ / layerHeight; //maxObjectHeight instead of objectHeight
  var extruder = 0.0;
  var prev = new Point(); prev.set(0, 0);

  // replacement (and improvement) for ofxGetCenterofMass
  var centerOfDoodle = {
    x: doodleBounds[0] + (doodleBounds[2]- doodleBounds[0])/2,
    y: doodleBounds[1] + (doodleBounds[3] - doodleBounds[1])/2
  }

  console.log("f:generategcode() >> layers: " + layers);
  if (layers == Infinity) return;

	// check feasibility of design
	var pointsToPrint = points.length * layers*(objectHeight/printerDimensionsZ)

	console.log("pointsToPrint: ",pointsToPrint);

  if(pointsToPrint > MAX_POINTS_TO_PRINT) {
  	alert("Sorry, your doodle is too complex or too high. Please try to simplify it.");
  	console.log("ERROR: to many points too convert to gcode");
  	return [];
  }

  for (var layer = 0; layer < layers; layer++) {

    //gcode.push(";LAYER:"+layer); //this will be added in a next release to support GCODE previewing in CURA

    var p = JSON.parse(JSON.stringify(points)); // [].concat(points);

    if (p.length < 2) return;
    var even = (layer % 2 == 0);
    var progress = layer / layers;

    var layerScale = scaleFunction(progress);

    // if begin point this row and end point last row are close enough, isLoop is true
    var isLoop = lineLength(points[0][0], points[0][1], points[points.length-1][0], points[points.length-1][1]) < 3;

    // set center of doodle as middle (ie subtract to that)
    pointsTranslate(p, -centerOfDoodle.x, -centerOfDoodle.y);
    pointsScale(p, screenToMillimeterScale,-screenToMillimeterScale);
    pointsScale(p, layerScale, layerScale);
    pointsRotate(p, rStepGCode * layer);

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

    // loop over the subpaths (the separately drawn lines)
    for (var j = 0; j < paths.length; j++) { // TODO paths > subpaths
      var commands = paths[j];

      // loop over the coordinates of the subpath
      for (var i = 0; i < commands.length; i++) {
        var last = commands.length - 1;

        var to = new Point(); to.set(commands[i][0], commands[i][1]);

        to.x += gCodeOffsetX;
        to.y += gCodeOffsetY;

        var sublayer = (layer == 0) ? 0.0 : layer + (useSubLayers ? (curLayerCommand/totalLayerCommands) : 0);
        var z = (sublayer + 1) * layerHeight; // 2013-09-06 removed zOffset (seemed to be useless)

        var isTraveling = !isLoop && i==0;
        var doRetract = retractionEnabled && prev.distance(to) > retractionminDistance;

        var firstPointEver = (layer == 0 && i == 0 && j == 0);
        if (firstPointEver || layer > 2 && enableTraveling && isTraveling) { //always travel to first point, then disable traveling for first two layers and use settings for remainder of print
          if (!firstPointEver && doRetract) gcode.push("G0 E" + (extruder - retractionamount).toFixed(3) + " F" + (retractionspeed * 60).toFixed(3)); //retract
          gcode.push("G0 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + z.toFixed(3) + " F" + (travelSpeed * 60).toFixed(3));
          if (!firstPointEver && doRetract) gcode.push("G0 E" + extruder.toFixed(3) + " F" + (retractionspeed * 60).toFixed(3)); // return to normal
        } else {
          var f = (layer < 2) ? bottomFlowRate : 1;
          extruder += prev.distance(to) * wallThickness * layerHeight / (Math.pow((filamentThickness/2), 2) * Math.PI) * f;
          gcode.push("G1 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + z.toFixed(3) + " F" + (speed * 60).toFixed(3) + " E" + extruder.toFixed(3));
        }

        curLayerCommand++;
        layerProgress = curLayerCommand/totalLayerCommands;
        prev = to;

      }

    }

    if ((layer/layers) > (objectHeight/printerDimensionsZ)) {
      console.log("f:generategcode() >> (layer/layers) > (objectHeight/printerDimensionsZ) is true -> breaking at layer " + (layer + 1));
      break;
    }
  }
  // add gcode end commands
  gcode = gcode.concat(endCode);

  return gcode;
}

function generateStartCode() {
	var printerType = settings["printer.type"];
	var startCode = settings["printer.startcode"];
	startCode = subsituteVariables(startCode);
	startCode = startCode.split("\n");
	return startCode;
}
function generateEndCode() {
	var printerType = settings["printer.type"];
	var endCode = settings["printer.endcode"];
	endCode = subsituteVariables(endCode);
	endCode = endCode.split("\n");
	return endCode;
}

function subsituteVariables(gcode) {
	//,temperature,bedTemperature,preheatTemperature,preheatBedTemperature
	var temperature 			      = settings["printer.temperature"];
	var bedTemperature 			    = settings["printer.bed.temperature"];
	var preheatTemperature      = settings["printer.heatup.temperature"];
	var preheatBedTemperature   = settings["printer.heatup.bed.temperature"];
  var printerType             = settings["printer.type"];
  var heatedbed             	= settings["printer.heatedbed"];

  switch (printerType) {
    case "makerbot_replicator2": printerType = "r2"; break; 
    case "makerbot_replicator2x": printerType = "r2x"; break;
    case "makerbot_thingomatic": printerType = "t6"; break;
    case "makerbot_generic": printerType = "r2"; break;
  }
  var heatedBedReplacement = (heatedbed)? "" : ";";

	gcode = gcode.replace(/{printingTemp}/gi  	,temperature);
	gcode = gcode.replace(/{printingBedTemp}/gi ,bedTemperature);
	gcode = gcode.replace(/{preheatTemp}/gi			,preheatTemperature);
	gcode = gcode.replace(/{preheatBedTemp}/gi 	,preheatBedTemperature);
  gcode = gcode.replace(/{printerType}/gi     ,printerType);
  gcode = gcode.replace(/{if heatedBed}/gi    ,heatedBedReplacement);
    
	return gcode;
}

function scaleFunction(percent) {
  var r = 1.0;

  switch (VERTICALSHAPE) {
    case verticalShapes.NONE:
      r = 1.0;
      break;
    case verticalShapes.DIVERGING:
      r = .5 + (percent * .5);
      break;
    case verticalShapes.CONVERGING:
      r = 1.0 - (percent * .8);
      break;
    case verticalShapes.SINUS:
      r = (Math.cos(percent * Math.PI * 4) * .25) + .75;
      break;
  }

//  return 1.0 - (percent *.8);
  return r;
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
