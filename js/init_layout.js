var drawAreaContainerMinHeight = 300;
var drawAreaContainerMaxHeight = 450;
function doOnResize() {
  //    console.log("doOnResize() >> " + new Date().getTime());
//  $(".container").css("height", window.innerHeight);

  $drawAreaContainer.css("marginLeft", -$drawAreaContainer.width()/2);
  $drawAreaContainer.css("marginTop", -$drawAreaContainer.height() *.45);
//  $drawAreaContainer.css("marginTop", -parseInt($drawAreaContainer.css("height")) * 0.45);

  canvas.width = $drawAreaContainer.width() - 150; // canvas.clientWidth;
  canvas.height = $drawAreaContainer.height(); // canvas.clientHeight;

  preview.width = 150;
  preview.height = $drawAreaContainer.height();
  calcPreviewCanvasProperties();
//  layerOffsetY = preview.height - 1.75 * layerCY;
//  yStep = preview.height / 150;
//  preview.width = parseInt($preview.css("width"), 10);
//  preview.height = parseInt($preview.css("height"), 10);

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

  drawCanvasTopLeftCoords[0] = drawCanvas.offset().left;
  drawCanvasTopLeftCoords[1] = drawCanvas.offset().top;
//  drawCanvasTopLeftCoords[0] = drawCanvas[0].offsetParent.offsetLeft;
//  drawCanvasTopLeftCoords[1] = drawCanvas[0].offsetParent.offsetTop;

//  preview.height = $("#previewContainer").height();
//  console.log("f:doOnResize() >> preview.height: " + preview.height);

  redrawDoodle();
  redrawPreview();

  return;

//  doClientAndOrientationStuff() // <-- is this necessary in this method?

//  console.log("f:doOnResize() >> $('#canvascontainer').innerHeight: " + window.innerHeight);
  if (window.innerHeight < 768) {
//    $('#drawAreaContainer').innerHeight(window.innerHeight - $("#drawAreaContainer").offset().top - 70);
    var newVal = window.innerHeight - $("#drawAreaContainer").offset().top - 100; // what's the 70 ??
    newVal = Math.max(newVal, drawAreaContainerMinHeight);
    newVal = Math.min(newVal, drawAreaContainerMaxHeight);

    $('#drawAreaContainer').innerHeight(newVal);

    // canvas drawing area
    $canvas.css("height", newVal);
    canvas.height = newVal;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    // preview area
    $preview.css("height", newVal);
    preview.height = newVal;
    layerOffsetY = preview.height - 1.75 * layerCY;
    yStep = preview.height / 150;

    redrawDoodle();
    redrawPreview();
  }
}

function initLayouting() {
  console.log("f:initLayouting()");

  // first set the css width/height and actual width/height of the drawing area
  <!--div drawAreaContainer 650,450-->
  <!--canvas mycanvas       500, 450-->
  <!--canvas preview      150, 450-->

//  $doodleCanvas = $("#mycanvas");
//  doodleCanvas = $("#mycanvas")[0];
//  doodleCanvasContext = doodleCanvas.getContext('2d');

  $drawAreaContainer = $("#drawAreaContainer");
  $drawAreaContainer.css("margin", 0);
  $drawAreaContainer.css("marginLeft", -$drawAreaContainer.width()/2);
  $drawAreaContainer.css("marginTop", -$drawAreaContainer.height() *.45);

  canvas.width = $drawAreaContainer.width() - 150; // canvas.clientWidth;
  canvas.height = $drawAreaContainer.height(); // canvas.clientHeight;

  preview.width = 150;
  preview.height = $drawAreaContainer.height();

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

  $drawAreaContainer.show();

  // window.innerHeight
  console.log("window.innerHeight: " + window.innerHeight);
  console.log("window.innerWidth: " + window.innerWidth);
  console.log("$('#drawAreaContainer').innerHeight(): " + $("#drawAreaContainer").innerHeight());
  console.log("$('#drawAreaContainer').offset().top: " + $("#drawAreaContainer").offset().top);


  /*  2013-07-26 not doing this resizing stuff now, it's not working well yet
  if (window.innerHeight < 768) {
    $('#drawAreaContainer').innerHeight(window.innerHeight - $("#drawAreaContainer").offset().top - 70);
  }
  //*/

  // timeout because it SEEMS to be beneficial for initting the layout
  // 2013-09-18 seems beneficial since when?
  setTimeout(_startOrientationAndChangeEventListening, 1000);
}

function _startOrientationAndChangeEventListening() {
  // Initial execution if needed

  $(window).on('resize', doOnResize);

  // is it necessary to call these? Aren't they called by the above eventhandlers?
//  doClientAndOrientationStuff();
  doOnResize();
}
