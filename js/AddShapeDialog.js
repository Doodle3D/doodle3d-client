var shapeResolution=3;
var shapePopup;

function initShapeDialog() {
  shapePopup = new Popup($("#popupShape"), $("#popupMask"));
  $("#btnShapeOk").on("onButtonClick", shapePopup.commit);
  $("#btnShapeCancel").on("onButtonClick", shapePopup.cancel);
  $("#popupShape").bind("onPopupCancel", onShapeCancel);
  $("#popupShape").bind("onPopupCommit", onShapeOk);
  
  $("#btnShapePlus").on("onButtonHold",onShapePlus);
  $("#btnShapeMin").on("onButtonHold",onShapeMin);
  updateShapePreview();
}

function showShapeDialog() {
	shapePopup.open();
}

function onShapeCancel() {
}

function onShapeOk() {
  var res = shapeResolution;

  if (res!=undefined) {
    if (isNaN(res)) res=3;
    if (res<2) res=2;
    if (res>100) res=100;
    drawCircle(canvasWidth/2,canvasHeight/2,80,res);   
  }
}

function onShapePlus() {
  shapeResolution++;
  if (shapeResolution>50) shapeResolution=50;
  updateShapePreview();
}

function onShapeMin() {
  shapeResolution--;
  if (shapeResolution<2) shapeResolution=2;
  updateShapePreview();
}

function updateShapePreview() {
  $(".lblShapeResolution").text(shapeResolution + " sides");

  var canvas = $("#shapePreview")[0];
  var c = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  //console.log(w,h);
  var r = w/2 - 20;
  var x0 = w/2;
  var y0 = h/2;
  var res = shapeResolution;
  var step = Math.PI * 2.0 / res;
  
  c.save();
  c.clearRect(0,0,canvas.width, canvas.height);
  c.restore();
  c.beginPath();
  for (var a=0; a<Math.PI*2; a+=step) {
    var x = Math.sin(a+Math.PI) * r + x0;
    var y = Math.cos(a+Math.PI) * r + y0;
    if (a==0) c.moveTo(x,y);
    else c.lineTo(x,y);
  }
  //close shape
  var x = Math.sin(0+Math.PI) * r + x0;
  var y = Math.cos(0+Math.PI) * r + y0;
  c.lineTo(x,y);

  //draw shape
  c.lineWidth = 2;
  c.stroke();
}