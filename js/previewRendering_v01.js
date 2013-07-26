//*
var preview;
var previewCtx;

var svgPathRegExp = /[LM]\d* \d*/ig;
var svgPathParamsRegExp = /([LM])(\d*) (\d*)/;

var prevRedrawTime = new Date().getTime();
var redrawInterval = 1000 / 20; // ms

function initPreviewRendering() {
  console.log("f:initPreviewRendering()");

  preview = document.getElementById('preview');
  previewCtx = preview.getContext('2d');

  redrawPreview();
}

//var numLayers 	= 100; //50
var numLayers 	= 100; // 100
var globalScale = 0.3;		// global scale of preview (width preview / width canvas)
var globalAlpha = 0.20;			// global alpha of preview
var scaleY 			= 0.4; 			// additional vertical scale per path for 3d effect
var viewerScale = 0.65;  // additional scale to fit into preview nicely (otherwise is fills out totally)
var strokeWidth = 2; //4; 
//var rStep 			= Math.PI/40; //Math.PI/40; //
var rStep 			= Math.PI/45; // Math.PI/180; //Math.PI/40; //
var yStep 			= 3; //6;
//var svgWidth 		= 500; // 650 //parseInt($(svg).css("width"));
//var svgHeight 	= 450; //450; //parseInt($(svg).css("height"));
var layerCX			= (canvasWidth / 2) * globalScale;  // defined in canvasDrawing_v01.js
var layerCY			= (canvasHeight / 2) * globalScale; // defined in canvasDrawing_v01.js
var layerOffsetY= 330;
var prevX 			= 0;
var prevY 			= 0;
var highlight		= true; //highlight bottom, middle and top layers

var linesRaw = "";
function redrawPreview() {
  //*/
  //TODO
  /*
    het up/down en twist left/right gaat nu wat traag. Juist dat gaat veel sneller met de toDataURL oplossing
    Is het een idee om op het einde van een touchevent wel de image versie te renderen maar tijdens het tekenen
    niet?
  */

  if (_points.length < 2) return;

  var y = 0;
  var r = 0;

  //preview.width = preview.width;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.lineWidth = strokeWidth;
  previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  for(var i = 0; i < numLayers; i++) {

    if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1){
      previewCtx.globalAlpha = 1;
    } else {
      previewCtx.globalAlpha = globalAlpha;
    }

    previewCtx.save();

    previewCtx.translate(layerCX, layerOffsetY + layerCY + y);
//    previewCtx.setTransform(1, 0, 0, scaleY, layerCX, layerOffsetY+layerCY+y);
    previewCtx.scale(viewerScale, scaleY * viewerScale);
    previewCtx.rotate(r);
    previewCtx.translate((-doodleTransform[0]) * (globalScale * doodleTransform[2]), (-doodleTransform[1]) * (globalScale * doodleTransform[3]));
//    previewCtx.translate(-layerCX,-layerCY);
//    previewCtx.translate(-doodleTransform[0] * globalScale, -doodleTransform[1] * globalScale);

//    previewCtx.setTransform(doodleTransform[2], 0, 0, doodleTransform[3], 0, 0);

    var adjustedDoodlePoint = centeredAndScaledDoodlePoint(_points[0]);

    previewCtx.beginPath();
    previewCtx.moveTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    for(var j = 1; j < _points.length; j++) {
      adjustedDoodlePoint = centeredAndScaledDoodlePoint(_points[j])
      previewCtx.lineTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    }
    previewCtx.stroke();

    y -= yStep;
    r += rStep;
    previewCtx.restore();
  }
  previewCtx.globalAlpha = globalAlpha;
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

/*
function updatePreview(x, y, move) {
  x *= globalScale;
  y *= globalScale;

  if(!move) {
    var tY = 0;
    var r = 0;

    if(!highlight) {
      previewCtx.globalAlpha = globalAlpha;
      previewCtx.beginPath();
    }
    for(var i=0;i<numLayers;i++) {

      if(highlight && (i == 0 || i == numLayers/2 || i == numLayers-1)){
        previewCtx.stroke();
        previewCtx.globalAlpha = 1;
        previewCtx.beginPath();
      }

      previewCtx.save();
      previewCtx.translate(layerCX,layerOffsetY+layerCY+tY);
      previewCtx.scale(1, scaleY)
      previewCtx.rotate(r);
      previewCtx.translate(-layerCX,-layerCY);

      previewCtx.moveTo(prevX,prevY);
      previewCtx.lineTo(x,y);

      tY -= yStep;
      r += rStep;
      previewCtx.restore();

      if(highlight && (i == 0 || i == numLayers/2 || i == numLayers-1)){
        previewCtx.stroke();
        previewCtx.globalAlpha = globalAlpha;
        previewCtx.beginPath();
      }
    }
  }
  previewCtx.stroke();
  prevX = x;
  prevY = y;
}
//*/