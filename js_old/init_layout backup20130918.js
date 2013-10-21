var imgDims = [320, 320]; // width and height of image

function doClientAndOrientationStuff() {
  console.log("f:doClientAndOrientationStuff()");

  $(".agentInfo").text("");

  /*
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
    if (window.orientation == -90 || window.orientation == 90) {
      // landscape
//      $('#Viewport').attr('content', 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=yes');
    } else {
      // portrait
      $('#Viewport').attr('content', 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=yes');
    }
  }
  return;
  //*/

  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
    console.log("PHONE OR TABLET! --> window.orientation = " + window.orientation);
    if (window.orientation == -90 || window.orientation == 90) {
      console.log("   landscape");
      // landscape

      //      var ww = ( $(window).width() < window.screen.width ) ? $(window).width() : window.screen.width; //get proper width
      var ww = 0; //get proper width
      if (window.innerWidth) {
        ww = window.innerWidth;
        //        if (window.screen.availWidth) {
//        ww = window.screen.availWidth;

//        if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
//          ww = window.innerWidth;
//        }
      } else if($(window).width()) {
        ww = $(window).width();
      } else {

      }

      //      ww = 480;

      var mw = imgDims[0]; // min width of site
      //*
      if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
        var mw = imgDims[1]; // in landscape: min-width is image width
      }
      //*/
      var ratio =  ww / mw; //calculate ratio
      $('#Viewport').attr('content', 'initial-scale='+ratio+',maximum-scale='+ratio+',minimum-scale='+ratio+',user-scalable=no,width='+mw);
      if( ww < mw){ //smaller than minimum size
//        $(".colmask").css("background-color", "#ff0");
        //        $('#Viewport').attr('content', 'initial-scale=' + ratio + ', maximum-scale=' + ratio + ', minimum-scale=' + ratio + ', user-scalable=yes, width=' + ww);
        //        $('#Viewport').attr('content', 'initial-scale=1.0, maximum-scale=2, minimum-scale=1.0, user-scalable=yes, width=' + ww);
      }else{ //regular size
//        $(".colmask").css("background-color", "#0ff");
        //        $('#Viewport').attr('content', 'initial-scale=1.0, maximum-scale=2, minimum-scale=1.0, user-scalable=yes, width=' + ww);
      }

      console.log("   ww: " + ww + ", mw: " + mw + ", ratio: " + ratio);

      $(".agentInfo").append("ww: " + ww + ", mw: " + mw + "<br/>");
      $(".agentInfo").append("ratio: " + ratio + "<br/>");
      $(".agentInfo").append("<br/>");
    } else {
      console.log("     portrait");
      // portrait
//      $('#Viewport').attr('content', 'initial-scale='+1+',maximum-scale='+1+',minimum-scale='+1+',user-scalable=no');
      $('#Viewport').attr('content', 'width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no');
    }

  } else {
    //      console.log("else");
    $(".colmask").css("background-color", "#f80");

  }


  $(".agentInfo").append("$(window).width(): " + $(window).width() + "<br/>");
  $(".agentInfo").append("window.screen.width: " + window.screen.width+ "<br/>");
  $(".agentInfo").append("window.screen.availWidth: " + window.screen.availWidth+ "<br/>");
  $(".agentInfo").append("<br/>");
  $(".agentInfo").append("window.innerWidth: " + window.innerWidth + "<br/>");
  $(".agentInfo").append("window.innerHeight: " + window.innerHeight + "<br/>");
  $(".agentInfo").append("<br/>");
  $(".agentInfo").append("$(window).height(): " + $(window).height() + "<br/>");
  $(".agentInfo").append("window.screen.height: " + window.screen.height+ "<br/>");
  $(".agentInfo").append("window.screen.availHeight: " + window.screen.availHeight+ "<br/>");
  $(".agentInfo").append("<br/>");
  $(".agentInfo").append("user agent: " + navigator.userAgent + "<br/>");
};

function doOnOrientationChange() {
  console.log("doOnOrientationChange");
  doClientAndOrientationStuff();

  //    switch(window.orientation) {
  //      case -90:
  //      case 90:
  //        alert('landscape');
  //        break;
  //      default:
  //        alert('portrait');
  //        break;
  //    }
}

var drawAreaContainerMinHeight = 300;
var drawAreaContainerMaxHeight = 450;
function doOnResize() {
  //    console.log("doOnResize() >> " + new Date().getTime());
//  $(".container").css("height", window.innerHeight);

  // code from new layouting approach... //TODO give this a more logical spot
  $drawAreaContainer.css("marginTop", -parseInt($drawAreaContainer.css("height"))/2);

  canvas.width = $drawAreaContainer.width() - 150; // canvas.clientWidth;
  canvas.height = $drawAreaContainer.height(); // canvas.clientHeight;
  //  canvas.width = canvas.clientWidth;
  //  canvas.height = canvas.clientHeight;

  //  $("#drawAreaContainer").attr("width", parseInt($("#drawAreaContainer").css("width"), 10));
  //  $("#drawAreaContainer").attr("height", parseInt($("#drawAreaContainer").css("height"), 10));
  //  canvas.width = parseInt($canvas.css("width"), 10);
  //  canvas.height = parseInt($canvas.css("height"), 10);

  preview.width = 150;
  preview.height = $drawAreaContainer.height();
//  preview.width = parseInt($preview.css("width"), 10);
//  preview.height = parseInt($preview.css("height"), 10);

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

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
  $drawAreaContainer.css("marginLeft", -parseInt($drawAreaContainer.css("width"))/2);
  $drawAreaContainer.css("marginTop", -parseInt($drawAreaContainer.css("height"))/2);

  canvas.width = $drawAreaContainer.width() - 150; // canvas.clientWidth;
  canvas.height = $drawAreaContainer.height(); // canvas.clientHeight;
//  canvas.width = canvas.clientWidth;
//  canvas.height = canvas.clientHeight;

  preview.width = 150;
  preview.height = $drawAreaContainer.height();

  // code from new layouting approach... //TODO give this a more logical spot
//  $("#drawAreaContainer").attr("width", parseInt($("#drawAreaContainer").css("width"), 10));
//  $("#drawAreaContainer").attr("height", parseInt($("#drawAreaContainer").css("height"), 10));
//  canvas.width = parseInt($canvas.css("width"), 10);
//  canvas.height = parseInt($canvas.css("height"), 10);
//  preview.width = parseInt($preview.css("width"), 10);
//  preview.height = parseInt($preview.css("height"), 10);
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

//  console.log("f:initLayouting() >> canvas height: " + canvas.height);



  //  imgDims[0] = parseInt($(".container").css("width").match(/[0-9]+/).join(""));
  //  imgDims[1] = parseInt($(".container").css("height").match(/[0-9]+/).join(""));

//  imgDims = [1024, 768];

  /*
   if( /Android|webOS|BlackBerry/i.test(navigator.userAgent) ) {
   imgDims[1] = parseInt($(".container").css("height").match(/[0-9]+/).join(""));
   } else if ( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
   imgDims[1] = parseInt($(".container").css("width").match(/[0-9]+/).join(""));
   } else {
   imgDims[1] = parseInt($(".container").css("height").match(/[0-9]+/).join(""));
   }
   //*/

  //  $(".container").css("height", window.innerHeight);

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

//  if (!window.addEventListener) {
//    window.attachEvent('orientationchange', doOnOrientationChange, false);
//    window.attachEvent('resize', doOnResize, false);
//  } else {
//    window.addEventListener('orientationchange', doOnOrientationChange, false);
//    window.addEventListener('resize', doOnResize, false);
//  }

  // is it necessary to call these? Aren't they called by the above eventhandlers?
//  doClientAndOrientationStuff();
  doOnResize();
}
