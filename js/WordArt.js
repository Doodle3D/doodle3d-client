var wordArtPopup;

function initWordArt() {
  $("body").append('<div id="svgfont" style="display:none"></div>');
  $("#svgfont").load("img/font.svg?");
  
  wordArtPopup = new Popup($("#popupWordArt"),$("#popupMask"));
  $("#btnWordArtOk").on("onButtonClick",wordArtPopup.commit);
  $("#btnWordArtCancel").on("onButtonClick",wordArtPopup.cancel);
  $("#popupWordArt").bind("onPopupCancel", onWordArtCancel);
  $("#popupWordArt").bind("onPopupCommit", onWordArtOk);
}

function showWordArtDialog() {
  buttonGroupAdd.hide();
  wordArtPopup.open();
  $("#txtWordArt").focus();
  $("#txtWordArt").val(""); //clear textbox
}

function onWordArtCancel() {
	$("#txtWordArt").blur();
}

function onWordArtOk() {
	$("#txtWordArt").blur();
	var s = $("#txtWordArt").val();
	drawTextOnCanvas(s);
}

function drawTextOnCanvas(text) {
	if (typeof(text) == 'string') {
		var points = getStringAsPoints(text);

		var bounds = getBounds(points);
		var scaleX = (canvasWidth-50) / bounds.width;
		var scaleY = (canvasHeight-50) / bounds.height;

		var scale = Math.min(scaleX,scaleY);

		scalePoints(points,scale);
		var bounds = getBounds(points);
		translatePoints(points,-bounds.x,-bounds.y); //left top of text is (0,0)
		translatePoints(points,-bounds.width/2,-bounds.height/2); //anchor point center
		translatePoints(points,canvasWidth/2,canvasHeight/2); //center in canvas

		canvasDrawPoints(canvas,points);
	}
}

function getStringAsPoints(text) {
  var allPoints = [];
  var xPos = 0;

  for (var i=0; i<text.length; i++) {

    if (text[i]==" ") { //space
      xPos += 8;
    } else { //other characters
      var path = getPathFromChar(text[i]);
      var points = getPointsFromPath(path);

      if (points.length==0) continue;

      translatePoints(points,-points[0][0],0);

      var bounds = getBounds(points);

      translatePoints(points,-bounds.x,0);
      translatePoints(points,xPos,0);

      xPos+=bounds.width;
      xPos+=2;

      for (var j=0; j<points.length; j++) {
        allPoints.push(points[j]);
      }
    }

  }
  return allPoints;
}

function getPathFromChar(ch) {
  var index = ch.charCodeAt(0)-33;
  var element = $("#svgfont path")[index];
  if (element==undefined) return "";
  return $("#svgfont path")[index].attributes["d"].value; //was nodeValue but that's depricated
}

function getPointsFromPath(path) {
  var points = [];
  var cmds = path.split(' ');
  var cursor = { x:0.0, y:0.0 };
  var move = false;
  var prevCmd = "";
  var lastCmd = "";

  //console.log(path);

  for (var i=0; i<cmds.length; i++) {
    var cmd = cmds[i];   
    var xy = cmd.split(",");  

    if (cmd.length==1) { //we suppose this is a alpha numeric character and threat it as a command
      lastCmd = cmd;
    }

		move = (lastCmd=='m' || lastCmd=='M');

		if (xy.length==2) {
  		
      var x = parseFloat(xy[0]);
      var y = parseFloat(xy[1]);

      if (lastCmd=='m' || lastCmd=='l') { //relative movement
        cursor.x += x;
        cursor.y += y;
      } 
      else if (lastCmd=='M' || lastCmd=='L') { //absolute movement
        cursor.x = x;
        cursor.y = y;
      }

      if (lastCmd=='m') lastCmd='l'; //the next command after a relative move is relative line if not overruled
      if (lastCmd=='M') lastCmd='L'; //same for absolute moves

      points.push([cursor.x,cursor.y,move]);
    
		} else if (prevCmd == "h"){
			cursor.x += parseFloat(cmd);
			points.push([cursor.x,cursor.y,move]);
		} else if (prevCmd == "v"){
			cursor.y += parseFloat(cmd);
			points.push([cursor.x,cursor.y,move]);
		} else if (prevCmd == "H"){
			cursor.x = parseFloat(cmd);
			points.push([cursor.x,cursor.y,move]);
		} else if (prevCmd == "V"){
			cursor.y = parseFloat(cmd);
			points.push([cursor.x,cursor.y,move]);
		} 
		prevCmd = cmd;
  }
  return points;
}

function canvasDrawPoints(canvas,points) {
  beginShape();
  for (var i=0; i<points.length; i++) {
    var p = points[i];
    if (points[i][2]) shapeMoveTo(p[0],p[1]);
    else shapeLineTo(p[0],p[1]);
  }
  endShape();
}
