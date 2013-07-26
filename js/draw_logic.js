var oopsTimer;
var dragging;
var path;
var svg;
var preview;
var previewCtx;

var svgPathRegExp = /[LM]\d* \d*/ig;
var svgPathParamsRegExp = /([LM])(\d*) (\d*)/;

var svgTopLeftCoords = [];
function initDrawing() {

	path = document.getElementById('path');
	svg = document.getElementById('svg');

  svgTopLeftCoords[0] = $("#drawAreaContainer").css("left").match(/[0-9]/g).join("");
  svgTopLeftCoords[1] = $("#drawAreaContainer").css("top").match(/[0-9]/g).join("");

  svg.addEventListener('mousedown',onMouseDown,false);
	svg.addEventListener('mousemove',onMouseMove,false);
	svg.addEventListener('mouseup',onMouseUp,false);
	svg.addEventListener('touchstart',onTouchDown,false);
	svg.addEventListener('touchmove',onTouchMove,false);
	btnNew.addEventListener('mousedown',clear,false);
	btnNew.addEventListener('touchstart',clear,false);
	btnOops.addEventListener('touchstart',startOops,false);
	btnOops.addEventListener('touchend',stopOops,false);
	btnOops.addEventListener('mousedown',startOops,false);
	btnOops.addEventListener('mouseup',stopOops,false);
	btnPrint.addEventListener('mousedown',print,false);
	btnPrint.addEventListener('touchstart',print,false);
	btnSave.addEventListener('mousedown',print,false);
	btnSave.addEventListener('touchstart',print,false);

	document.body.addEventListener('touchmove',prevent,false);
	
	preview = document.getElementById('preview');
	previewCtx = preview.getContext('2d');
	redrawPreview();
};

function prevent(e) {
	e.preventDefault();
}

function clear() {
	path.attributes.d.nodeValue = "M0 0";
	redrawPreview();
}

function startOops() {
	oopsTimer = setInterval("oops()",1000/30);
}

function stopOops() {
	clearInterval(oopsTimer);
}

function oops() {
	str = path.attributes.d.nodeValue;
	n = str.lastIndexOf(" L");
	if(n != -1) {
		path.attributes.d.nodeValue = str.substr(0,n);	
		redrawPreview();
		//requestAnimationFrame(updatePreview);
	}
}

function moveTo(x,y) {
	if (path.attributes.d.nodeValue=="M0 0") {
		path.attributes.d.nodeValue = "M" + x + " " + y;
	} else {
		path.attributes.d.nodeValue += " M" + x + " " + y;
	}
	updatePreview(x,y,true)
	//redrawPreview();
}

function lineTo(x,y) {
	path.attributes.d.nodeValue += " L" + x + " " + y;
	//updatePreview();
	//requestAnimationFrame(updatePreview);
	updatePreview(x,y,false);
}

function onTouchDown(e) {
	var x = e.touches[0].pageX - svgTopLeftCoords[0];
	var y = e.touches[0].pageY - svgTopLeftCoords[1];
	moveTo(x,y);	
}

function onTouchMove(e) {
	e.preventDefault();
  var x = e.touches[0].pageX - svgTopLeftCoords[0];
	var y = e.touches[0].pageY - svgTopLeftCoords[1];
	lineTo(x,y);
}

function onMouseDown(e) {
	dragging = true;
	moveTo(e.offsetX,e.offsetY);
}

function onMouseMove(e) {
	if (!dragging) return;
	lineTo(e.offsetX,e.offsetY);
}

function onMouseUp(e) {
	dragging = false;
}

function print(e) {

	output = path.attributes.d.nodeValue;
	console.log(output);

	output = output.split("M").join("\n");
	output = output.split(" L").join("_");
	output = output.split(" ").join(",");
	output = output.split("_").join(" ");

	output = "\nBEGIN\n" + output + "\n\nEND\n";

  console.log("output :" + output );

	$.post("/doodle3d.of", { data:output }, function(data) {
	 	btnPrint.disabled = false;
	});
}

var numLayers 	= 100; //50
var globalScale = 0.20;			// global scale of preview
var globalAlpha = 0.20;			// global alpha of preview
var scaleY 			= 0.4; 			// additional vertical scale per path for 3d effect
var strokeWidth = 2; //4; 
var rStep 			= Math.PI/40; //Math.PI/40; //
var yStep 			= 3; //6;
var svgWidth 		= 650; //parseInt($(svg).css("width"));
var svgHeight 	= 450; //parseInt($(svg).css("height"));
var layerCX			= svgWidth/2*globalScale;
var layerCY			= svgHeight/2*globalScale;
var layerOffsetY= 360;
var prevX 			= 0;
var prevY 			= 0;
var highlight		= true; //highlight bottom, middle and top layers

function redrawPreview() {
	var svgData = path.attributes.d.nodeValue;
	var linesRaw = svgData.match(svgPathRegExp);
  console.log("svgData: " + svgData);
  console.log("linesRaw: " + linesRaw);
  console.log("");
//  console.log("");
	var lines = new Array();
	for(var i=0;i<linesRaw.length;i++) {
		var lineRaw = linesRaw[i];
		var results = svgPathParamsRegExp.exec(lineRaw);
  console.log("results: " + results);
  console.log("");
		results[2] = parseInt(results[2])*globalScale; // posX
		results[3] = parseInt(results[3])*globalScale; // posY
		lines.push(results);
	}
  console.log("");
  console.log("");

	var y = 0;
	var r = 0;
	
	//preview.width = preview.width;
	previewCtx.clearRect (0,0,preview.width,preview.height);
	previewCtx.lineWidth = strokeWidth;
	previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";
	
	for(var i=0;i<numLayers;i++) {
		
		if(i == 0 || i == numLayers/2 || i == numLayers-1){
  		previewCtx.globalAlpha = 1;
		} else {
  		previewCtx.globalAlpha = globalAlpha;
		}
			
		previewCtx.save();
		
		previewCtx.translate(layerCX,layerOffsetY+layerCY+y);		
		previewCtx.scale(1, scaleY)
		previewCtx.rotate(r);	
		previewCtx.translate(-layerCX,-layerCY);
		
		previewCtx.beginPath();
		for(var j=0;j<lines.length;j++) {
			var line = lines[j];
			var command = line[1];
			var posX = line[2];
			var posY = line[3];
			if(command == "M") previewCtx.moveTo(posX,posY);
			else if(command == "L") previewCtx.lineTo(posX,posY);	
		}
		previewCtx.stroke();
		
		y -= yStep;
		r += rStep;
		previewCtx.restore();
	}
	previewCtx.globalAlpha = globalAlpha;
}
function updatePreview(x,y,move) {
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

/*(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());*/