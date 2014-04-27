var scanPopup;
var canvasScan,canvasScanCtx;
var contourFinder;

function initScan() {
  // $("body").append('<div id="svgfont" style="display:none"></div>');
  // $("#svgfont").load("img/font.svg?");
  
  scanPopup = new Popup($("#popupScan"),$("#popupMask"));
  $("#btnScanOk").on("onButtonClick",scanPopup.commit);
  // $("#btnWordArtCancel").on("onButtonClick",wordArtPopup.cancel);
  $("#scanPopup").bind("onPopupCancel", onScanCancel);
  $("#scanPopup").bind("onPopupCommit", onScanOk);

  contourFinder = new ContourFinder();

  canvasScan = $("#canvasScan");  
  canvasScanCtx = canvasScan[0].getContext('2d');

}

function showScanDialog() {
  buttonGroupAdd.hide();
  scanPopup.open();
  // console.log("canvas: ", canvasScanCtx);
  // alert("hoi");
  loadImage();

  // $("#txtWordArt").focus();
  // $("#txtWordArt").val(""); //clear textbox
}

function loadImage() {
  var img = new Image();
  img.src = "/doodle3d-contours/images/foto-(7).png";
  img.onload = function() {
    // alert("hoi");
    canvasScanCtx.drawImage(img, 0, 0);

    var foregroudColor = 255;
    var backgroundColor = 0;
    //var threshold = 160; //doodle3D logo
    var threshold = 62; //arcade

    contourFinder.findContours(canvasScan[0],foregroudColor,backgroundColor,threshold);

    for (var i=0; i<contourFinder.allpoints.length; i++) {
      canvasScanCtx.strokeStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
      drawContour(i);
    }

  }
      //logo.src = "images/logo.png";     
}

function drawContour(index) {
  var points = contourFinder.allpoints[index];
  if (points.length<=0) return;

  beginShape();
  for (var i=0; i<points.length; i++) {
    // var p = points[i];
    if (points[i][2]) shapeMoveTo(points[i][0],points[i][1]);
    else shapeLineTo(points[i][0],points[i][1]);
  }
  endShape();
  
  // canvasScanCtx.beginPath();
  // canvasScanCtx.moveTo(points[0][0],points[0][1]); 
  // for (var i=0; i<points.length; i++) {
  //   canvasScanCtx.lineTo(points[i][0],points[i][1]);
  // }
  // canvasScanCtx.stroke();
}

function canvasDrawPoints(canvas,points) {
  
}

function onScanCancel() {
	// $("#txtWordArt").blur();
}

function onScanOk() {
	// $("#txtWordArt").blur();
	// var s = $("#txtWordArt").val();
	// drawTextOnCanvas(s);
}

// function drawTextOnCanvas(text) {
// 	if (typeof(text) == 'string') {
// 		var points = getStringAsPoints(text);

// 		var bounds = getBounds(points);
// 		var scaleX = (canvasWidth-50) / bounds.width;
// 		var scaleY = (canvasHeight-50) / bounds.height;

// 		var scale = Math.min(scaleX,scaleY);

// 		scalePoints(points,scale);
// 		var bounds = getBounds(points);
// 		translatePoints(points,-bounds.x,-bounds.y); //left top of text is (0,0)
// 		translatePoints(points,-bounds.width/2,-bounds.height/2); //anchor point center
// 		translatePoints(points,canvasWidth/2,canvasHeight/2); //center in canvas

// 		canvasDrawPoints(canvas,points);
// 	}
// }

// function getStringAsPoints(text) {
//   var allPoints = [];
//   var xPos = 0;

//   for (var i=0; i<text.length; i++) {

//     if (text[i]==" ") { //space
//       xPos += 8;
//     } else { //other characters
//       var path = getPathFromChar(text[i]);
//       var points = getPointsFromPath(path);

//       if (points.length==0) continue;

//       translatePoints(points,-points[0][0],0);

//       var bounds = getBounds(points);

//       translatePoints(points,-bounds.x,0);
//       translatePoints(points,xPos,0);

//       xPos+=bounds.width;
//       xPos+=2;

//       for (var j=0; j<points.length; j++) {
//         allPoints.push(points[j]);
//       }
//     }

//   }
//   return allPoints;
// }

// function getPathFromChar(ch) {
//   var index = ch.charCodeAt(0)-33;
//   var element = $("#svgfont path")[index];
//   if (element==undefined) return "";
//   return $("#svgfont path")[index].attributes["d"].nodeValue;
// }

// function getPointsFromPath(path) {
//   var points = [];
//   var cmds = path.split(' ');
//   var cursor = { x:0.0, y:0.0 };
//   var move = false;
//   var prevCmd = "";
//   for (var i=0; i<cmds.length; i++) {
//     var cmd = cmds[i];   
//     var xy = cmd.split(",");
// 		if (cmd=='m') move = true;
// 		if (xy.length==2) { // if there are two parts (a comma) we asume it's a l command. (So L is not supported)
// 			cursor.x += parseFloat(xy[0]);
// 			cursor.y += parseFloat(xy[1]);
// 			points.push([cursor.x,cursor.y,move]);
// 			move = false;
// 		} else if (prevCmd == "h"){
// 			cursor.x += parseFloat(cmd);
// 			points.push([cursor.x,cursor.y,move]);
// 		} else if (prevCmd == "v"){
// 			cursor.y += parseFloat(cmd);
// 			points.push([cursor.x,cursor.y,move]);
// 		} else if (prevCmd == "H"){
// 			cursor.x = parseFloat(cmd);
// 			points.push([cursor.x,cursor.y,move]);
// 		} else if (prevCmd == "V"){
// 			cursor.y = parseFloat(cmd);
// 			points.push([cursor.x,cursor.y,move]);
// 		} 
// 		prevCmd = cmd;
//   }
//   return points;
// }

// function canvasDrawPoints(canvas,points) {
//   beginShape();
//   for (var i=0; i<points.length; i++) {
//     var p = points[i];
//     if (points[i][2]) shapeMoveTo(p[0],p[1]);
//     else shapeLineTo(p[0],p[1]);
//   }
//   endShape();
// }

