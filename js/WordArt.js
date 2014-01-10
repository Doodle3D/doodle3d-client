function initWordArt() {
	$("body").append('<div id="svgfont" style="display:none"></div>');
	$("#svgfont").load("img/font.svg?");
  $("#btnWordArtOk").on("onButtonClick",onWordArtOk);
  $("#btnWordArtCancel").on("onButtonClick",onWordArtCancel);
}

function showWordArtDialog() {
  buttonGroupAdd.hide();
  showPopup(popupWordArt);
  $("#txtWordArt").focus();
  $("#txtWordArt").val(""); //clear textbox
}

function onWordArtCancel() {
  hidePopup(popupWordArt);
}

function onWordArtOk() {
  hidePopup(popupWordArt);

  var s = $("#txtWordArt").val();

  if (s!=undefined) {
    var points = getStringAsPoints(s);
    
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
  return $("#svgfont path")[index].attributes["d"].nodeValue;
}

function getPointsFromPath(path) {
  var points = [];
  var cmds = path.split(' ');
  var cursor = { x:0.0, y:0.0 };
  var move = false;
  for (var i=0; i<cmds.length; i++) {
    var cmd = cmds[i];
    var xy = cmds[i].split(",");
    if (cmd=='m') move = true;
    if (xy.length==2) {
      cursor.x += parseFloat(xy[0]);
      cursor.y += parseFloat(xy[1]);
      points.push([cursor.x,cursor.y,move]); //{x:cursor.x,y:cursor.y,move:move})
      move = false;
    }
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
