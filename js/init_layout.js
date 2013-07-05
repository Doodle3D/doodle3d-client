var imgDims = [320, 320]; // width and height of image

function doClientAndOrientationStuff() {
  console.log("doClientAndOrientationStuff");

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
    if (window.orientation == -90 || window.orientation == 90) {
      // landscape

      //      var ww = ( $(window).width() < window.screen.width ) ? $(window).width() : window.screen.width; //get proper width
      var ww = 0; //get proper width
      if (window.screen.availWidth) {
        ww = window.screen.availWidth;
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
      $('#Viewport').attr('content', 'initial-scale='+ratio+',maximum-scale='+ratio+',minimum-scale='+ratio+',user-scalable=yes,width='+mw);
      if( ww < mw){ //smaller than minimum size
//        $(".colmask").css("background-color", "#ff0");
        //        $('#Viewport').attr('content', 'initial-scale=' + ratio + ', maximum-scale=' + ratio + ', minimum-scale=' + ratio + ', user-scalable=yes, width=' + ww);
        //        $('#Viewport').attr('content', 'initial-scale=1.0, maximum-scale=2, minimum-scale=1.0, user-scalable=yes, width=' + ww);
      }else{ //regular size
//        $(".colmask").css("background-color", "#0ff");
        //        $('#Viewport').attr('content', 'initial-scale=1.0, maximum-scale=2, minimum-scale=1.0, user-scalable=yes, width=' + ww);
      }

      $(".agentInfo").append("ww: " + ww + ", mw: " + mw + "<br/>");
      $(".agentInfo").append("ratio: " + ratio + "<br/>");
      $(".agentInfo").append("<br/>");
    } else {
      // portrait
//      $('#Viewport').attr('content', 'initial-scale='+1+',maximum-scale='+1+',minimum-scale='+1+',user-scalable=no');
      $('#Viewport').attr('content', 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=yes');
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

function doOnResize() {
  //    console.log("doOnResize() >> " + new Date().getTime());
//  $(".container").css("height", window.innerHeight);
  doClientAndOrientationStuff()

  if (window.innerHeight < 768) {
    $('#drawAreaContainer').innerHeight(window.innerHeight - $("#drawAreaContainer").offset().top - 70);
  }
}


$("document").ready(function(){
  console.log("ready");

  initDrawing();

//  imgDims[0] = parseInt($(".container").css("width").match(/[0-9]+/).join(""));
//  imgDims[1] = parseInt($(".container").css("height").match(/[0-9]+/).join(""));

  imgDims = [1024, 768];
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

  // Initial execution if needed
  window.addEventListener('orientationchange', doOnOrientationChange);
  window.addEventListener('resize', doOnResize)
  doClientAndOrientationStuff();
//    doOnOrientationChange();

  // window.innerHeight
  console.log("window.innerHeight: " + window.innerHeight);
  console.log("$('#drawAreaContainer').innerHeight(): " + $("#drawAreaContainer").innerHeight());
  console.log("$('#drawAreaContainer').offset().top: " + $("#drawAreaContainer").offset().top);

  if (window.innerHeight < 768) {
    $('#drawAreaContainer').innerHeight(window.innerHeight - $("#drawAreaContainer").offset().top - 70);
  }

  // DEBUG
//  $(".agentInfo").css("display", "none");
  $(".debugBtn").click(function(e) {
    console.log("debugClick");
    $(".agentInfo").toggleClass("agentInfoToggle");
    e.preventDefault();
  })

})

