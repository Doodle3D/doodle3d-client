/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

//*
var $preview;
var preview;
var previewCtx;

var preview_tmp;
var previewCtx_tmp;

var previewDefaults = {
  rotation: 0, //Math.PI/90,
  numLayers: 10
}

var svgPathRegExp = /[LM]\d* \d*/ig;
var svgPathParamsRegExp = /([LM])(\d*) (\d*)/;

var prevRedrawTime = new Date().getTime();
var redrawInterval = 1000 / 30; // ms

function initPreviewRendering() {
  //console.log("f:initPreviewRendering()");

  $preview = $("#preview");
  preview = $preview[0];
  previewCtx = preview.getContext('2d');

  // DEBUG --> mbt preview_tmp (voor de toImageData truc)
  var _ratio  = preview.width / canvas.width;
  preview_tmp = document.getElementById('preview_tmp');
  preview_tmp.width = preview.width;
  preview_tmp.height = canvas.height * _ratio;
  $("#preview_tmp").css("top", -preview_tmp.height);

  previewCtx_tmp = preview_tmp.getContext('2d');

//  doodleImageCapture = new Image();

  calcPreviewCanvasProperties();
  redrawPreview();

  // needed to
//  doodleImageCapture = new Image();
}

function calcPreviewCanvasProperties() {
//  console.log("f:calcPreviewCanvasProperties()");

  globalScale = preview.width / canvasWidth;
  layerCX			= (canvasWidth / 2) * globalScale;  // defined in canvasDrawing_v01.js
  layerCY			= (canvasHeight / 2) * globalScale; // defined in canvasDrawing_v01.js
//  layerOffsetY = preview.height - 1.75 * layerCY;
  layerOffsetY = preview.height * (1 - previewVerticalPadding.bottom);
  yStep 			= (preview.height - (preview.height * (previewVerticalPadding.top + previewVerticalPadding.bottom))) / maxNumLayers;
}

// TODO (perhaps) : make the twist limit dynamic, depending on what's printable (w.r.t. overlapping)
var previewRotationLimit = Math.PI / 30; // rough estimate

var numLayers 	= previewDefaults.numLayers;     // current number of preview layers
var maxNumLayers= 100;    // maximum number of preview layers
var minNumLayers= 2;      // minimum number of preview layers
var globalScale = 0.3;		// global scale of preview (width preview / width canvas)
var globalAlpha = 0.20;   // global alpha of preview
var scaleY 			= 0.4; 		// additional vertical scale per path for 3d effect
var viewerScale = 0.65;   // additional scale to fit into preview nicely (otherwise is fills out totally)
var previewVerticalPadding = { "top" : .15, "bottom" : 0.12 }; // %
var strokeWidth = 2;      //4;
//var rStep 			= Math.PI/40; //Math.PI/40; //
var rStep 			= previewDefaults.rotation; // Math.PI/180; //Math.PI/40; //
var yStep;// 			= preview.height / 150; // 3; //6;
//var svgWidth 		= 500; // 650 //parseInt($(svg).css("width"));
//var svgHeight 	= 450; //450; //parseInt($(svg).css("height"));
var layerCX, layerCY;
//var layerCX			= (canvasWidth / 2) * globalScale;  // defined in canvasDrawing_v01.js
//var layerCY			= (canvasHeight / 2) * globalScale; // defined in canvasDrawing_v01.js
var layerOffsetY; //= preview.height - 1.75 * layerCY; // 330; // previewHeight - 120
var prevX 			= 0;
var prevY 			= 0;
var highlight		= true; //highlight bottom, middle and top layers

var linesRaw = "";
var debug_redrawSimplification = 6;
function redrawPreview(redrawLess) {
	//console.log("PreviewRendering:redrawPreview");
  if (redrawLess == undefined) redrawLess = false;

  if (_points.length < 2) {
	  previewCtx.clearRect(0, 0, preview.width, preview.height);
	  return;
  }

  if (!redrawLess) {
    //debug_redrawSimplification = Math.round(_points.length / 65);
    //*
    if (_points.length < 100) {
      debug_redrawSimplification = 6;
    } else if (_points.length < 250) {
      debug_redrawSimplification = 7;
    } else if (_points.length < 400) {
      debug_redrawSimplification = 8;
    } else if (_points.length < 550) {
      debug_redrawSimplification = 9;
    } else if (_points.length < 700) {
      debug_redrawSimplification = 10;
    } else {
      debug_redrawSimplification = 11;
    }
    //*/
//    console.log("debug_redrawSimplification: " + debug_redrawSimplification);
  }

  var y = 0;
  var r = 0;

  //preview.width = preview.width;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.lineWidth = strokeWidth;
  previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  for(var i = 0; i < numLayers; i++) {

    var verticalScaleFactor = scaleFunction(i / maxNumLayers);

    if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) {
      previewCtx.globalAlpha = 1;
    } else {
      previewCtx.globalAlpha = globalAlpha;
    }

    if (redrawLess && i%debug_redrawSimplification != 0 && !(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) ) {
      y -= yStep;
      r += rStep;
      continue;
    }

    previewCtx.save();

//    previewCtx.translate(layerCX, layerOffsetY + layerCY + y);
    previewCtx.translate(layerCX, layerOffsetY + y);
//    previewCtx.setTransform(1, 0, 0, scaleY, layerCX, layerOffsetY+layerCY+y);
    previewCtx.scale(viewerScale * verticalScaleFactor, scaleY * viewerScale * verticalScaleFactor);
    previewCtx.rotate(r);
    previewCtx.translate((-doodleTransform[0]) * (globalScale * doodleTransform[2]), (-doodleTransform[1]) * (globalScale * doodleTransform[3]));

    var adjustedDoodlePoint = centeredAndScaledDoodlePoint(_points[0]);

    previewCtx.beginPath();
    previewCtx.moveTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    for(var j = 1; j < _points.length; j++) {
      adjustedDoodlePoint = centeredAndScaledDoodlePoint(_points[j])
      if (redrawLess && j%debug_redrawSimplification != 0 ) continue;
      previewCtx.lineTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    }
    previewCtx.stroke();

    y -= yStep;
    r += rStep;
    previewCtx.restore();
  }
  previewCtx.globalAlpha = globalAlpha;
}

function renderToImageDataPreview() {
	//console.log("PreviewRendering:renderToImageDataPreview");
  if (_points.length < 2) return;

  //*
  // the first step
  previewCtx_tmp.clearRect(0, 0, preview.width, preview.height);
  previewCtx_tmp.lineWidth = strokeWidth;
  previewCtx_tmp.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  previewCtx_tmp.save();
  previewCtx_tmp.translate(layerCX, layerCY);
  previewCtx_tmp.scale(viewerScale, viewerScale);
  previewCtx_tmp.translate((-doodleTransform[0]) * (globalScale * doodleTransform[2]), (-doodleTransform[1]) * (globalScale * doodleTransform[3]));

  var adjustedDoodlePt = centeredAndScaledDoodlePoint(_points[0]);

  previewCtx_tmp.beginPath();
  previewCtx_tmp.moveTo(adjustedDoodlePt.x, adjustedDoodlePt.y);
  for(var j = 1; j < _points.length; j++) {
    adjustedDoodlePt = centeredAndScaledDoodlePoint(_points[j])
    previewCtx_tmp.lineTo(adjustedDoodlePt.x, adjustedDoodlePt.y);
  }
  previewCtx_tmp.stroke();
  previewCtx_tmp.closePath();
  previewCtx_tmp.restore();
  //*/

  //  var saved_rect = previewCtx_tmp.getImageData(0, 0, layerCX*2, layerCY*2);
  var saved_rect_todataurl = preview_tmp.toDataURL();
  doodleImageCapture = new Image();
  doodleImageCapture.onload = function() {

    previewCtx.clearRect(0, 0, preview.width, preview.height);
    previewCtx.lineWidth = strokeWidth;
    previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

    var y = 0;
    var r = 0;

    for(var i=0;i<numLayers;i++) {

      var verticalScaleFactor = scaleFunction(i / maxNumLayers);

      if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1){
        previewCtx.globalAlpha = 1;
      } else {
        previewCtx.globalAlpha = globalAlpha;
      }

      previewCtx.save();

      previewCtx.translate(layerCX,layerOffsetY+y);
//      previewCtx.scale(1, scaleY)
      previewCtx.scale(verticalScaleFactor, scaleY * verticalScaleFactor)
      previewCtx.rotate(r);
      previewCtx.translate(-layerCX,-layerCY);

      previewCtx.drawImage(doodleImageCapture, 0, 0);

      y -= yStep;
      r += rStep;
      previewCtx.restore();
    }
  };
  doodleImageCapture.src = saved_rect_todataurl;

  previewCtx.globalAlpha = globalAlpha;
}

// called by the move up/down, twist left/right or new buttons
// it is assumed that the preview has been rendered to an Image object, which will be used to draw the preview with (much better performance)
function redrawRenderedPreview(redrawLess) {
	//console.log("PreviewRendering:redrawRenderedPreview");
  if (redrawLess == undefined) redrawLess = false;
//  console.log("f:redrawRenderedPreview()");

  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.lineWidth = strokeWidth;
  previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  var y = 0;
  var r = 0;
  
  // check if there is preview image data that we can use for the layers
  if(!doodleImageCapture.src || doodleImageCapture.src == "") return;
  
  for(var i = 0; i < numLayers; i++) {

    var verticalScaleFactor = scaleFunction(i / maxNumLayers);

    if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1){
      previewCtx.globalAlpha = 1;
    } else {
      previewCtx.globalAlpha = globalAlpha;
    }

    if (redrawLess && i%2 != 0 && !(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) ) {
      y -= yStep;
      r += rStep;
      continue;
    }
    previewCtx.save();

    previewCtx.translate(layerCX,layerOffsetY+y);
//    previewCtx.scale(1, scaleY)
    previewCtx.scale(verticalScaleFactor, scaleY * verticalScaleFactor);
    previewCtx.rotate(r);
    previewCtx.translate(-layerCX,-layerCY);
    
    previewCtx.drawImage(doodleImageCapture, 0, 0);

    y -= yStep;
    r += rStep;
    previewCtx.restore();
  }
}

function centeredAndScaledDoodlePoint(p) {
  var obj = { x: 0, y: 0};

  obj.x = (p[0] - ((doodleBounds[2] - doodleBounds[0])/2)) * (globalScale * doodleTransform[2]);
  obj.y = (p[1] - ((doodleBounds[3] - doodleBounds[1])/2)) * (globalScale * doodleTransform[3]);
//  obj.x = (p[0] - (doodleBounds[2] - doodleBounds[0])) * (globalScale * doodleTransform[2]);
//  obj.y = (p[1] - (doodleBounds[3] - doodleBounds[1])) * (globalScale * doodleTransform[3]);
//  obj.x = (p[0] - doodleTransform[0]) * (globalScale * doodleTransform[2]);
//  obj.y = (p[1] - doodleTransform[1]) * (globalScale * doodleTransform[3]);

  return obj;
}

//*
var updatePrevX = -1;
var updatePrevY = -1;
function updatePreview(_x, _y, redrawLess) {
	//console.log("PreviewRendering:updatePreview");
  if (redrawLess == undefined) redrawLess = false;
  redrawLess = false;

  if (_points.length < 2) return;
  if (updatePrevX == -1 || updatePrevY == -1) {
    updatePrevX = _x;
    updatePrevY = _y;
    return;
  }

//  if (_points.length < 16 && Math.sqrt(Math.pow((updatePrevX - _x), 2) + Math.pow((updatePrevY - _y), 2)) < 8) return;

  var y = 0;
  var r = 0;

  previewCtx.lineWidth = strokeWidth;
  previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  for(var i = 0; i < numLayers; i++) {

    if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) {
      previewCtx.globalAlpha = 1;
    } else {
      previewCtx.globalAlpha = globalAlpha;
    }

    if (redrawLess && i%debug_redrawSimplification != 0 && !(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) ) {
      y -= yStep;
      r += rStep;
      continue;
    }

    previewCtx.save();

//    previewCtx.translate(layerCX, layerOffsetY + layerCY + y);
    previewCtx.translate(layerCX, layerOffsetY + y);
    previewCtx.scale(viewerScale, scaleY * viewerScale);
    previewCtx.rotate(r);
    previewCtx.translate((-doodleTransform[0]) * (globalScale * doodleTransform[2]), (-doodleTransform[1]) * (globalScale * doodleTransform[3]));


    previewCtx.beginPath();
    var prevPoint = centeredAndScaledDoodlePoint([updatePrevX, updatePrevY]);
    previewCtx.moveTo(prevPoint.x, prevPoint.y);
    var adjustedDoodlePoint = centeredAndScaledDoodlePoint([_x, _y]);
    previewCtx.lineTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    previewCtx.stroke();

    y -= yStep;
    r += rStep;
    previewCtx.restore();
  }
  previewCtx.globalAlpha = globalAlpha;
  updatePrevX = _x;
  updatePrevY = _y;

}
//*/
