var Viewer = function(viewer) {
  var className = "Viewer";
  var doodles = [];

  //Object houd data bij van svg transformaties
  //(alle svg's worden automatisch hier in gezet, positie is relatief aan zijn html parent)
  //  x -> x positie
  //  y -> y positie
  //  scale -> scale
  //  svg -> svg object
  var svgsData = [];

  console.log(className,viewer);

  function setDoodles(_doodles) {
    doodles = _doodles;
    console.log(className,'items',doodles);

    for (var i=0; i<doodles.length; i++) {
      var doodle = doodles[i];
      var path = doodle.getPath();
      var svgData = doodle.getSvgPathDescription();
      var box = path.getBoundingBox();

      var svg = $('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="640" height="540"><path xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" stroke-width="2" d="'+svgData+'"></path></svg>');
      viewer.append(svg);

      var box = path.getBoundingBox();
      var viewbox = box.getX() + " " + box.getY() + " " + box.getWidth() + " " + box.getHeight();
      svg[0].setAttribute("viewBox", viewbox); //changig the viewBox with jQuery doesn't work (may be because of capital B)
      svg.attr('width',box.getWidth()+2);
      svg.attr('height',box.getHeight()+2);

      initTouch(svg,doodle)
    }
  }

  function initTouch(svg,doodle) {
    // $("svg").each(function () {
    //   var svg = $(this);
    //   var data = {
    //     x: 0,
    //     y: 0,
    //     scale: 1,
    //   };
    //   svgsData.push(data);

    var startX;
    var startY;
    var touchX;
    var touchY;
    var offsetX = 0;
    var offsetY = 0;
    var handleGesture = false;

    var offsetZoom = 1;
    var zoom = 1;

    var mouseDown = false;

    svg.on("mousedown", function (e) {
      var event = e.originalEvent;
      mouseDown = true;

      touchX = startX = event.pageX;
      touchY = startY = event.pageY;
    });

    $(document).on("mousemove", function (e) {
      if (mouseDown) {
        var event = e.originalEvent;

        touchX = event.pageX;
        touchY = event.pageY;

        var dX = touchX - startX;
        var dY = touchY - startY;

        svg.css({
          left: offsetX + dX,
          top: offsetY + dY
        });
      }
    });

    svg.on("mouseup", function (e) {
      var event = e.originalEvent;
      mouseDown = false;

      offsetX = offsetX + touchX - startX;
      offsetY = offsetY + touchY - startY;

      setData();
    });

    svg.on("touchstart", function (e) {
      var event = e.originalEvent;
      event.preventDefault();

      if (event.touches.length === 1) {
        var touch = event.touches[0];

        touchX = startX = touch.pageX;
        touchY = startY = touch.pageY;
      }
      else {
        handleGesture = true;
      }
    });

    svg.on("touchmove", function (e) {
      var event = e.originalEvent;
      event.preventDefault();

      if (event.touches.length === 1 && !handleGesture) {
        var touch = event.touches[0];
        touchX = touch.pageX;
        touchY = touch.pageY;

        var dX = touchX - startX;
        var dY = touchY - startY;

        svg.css({
          left: offsetX + dX,
          top: offsetY + dY
        });
      }
    });

    svg.on("touchend", function (e) {
      var event = e.originalEvent;

      if (event.touches.length === 0) {
        if (handleGesture) {
          handleGesture = false;
        }
        else {
          offsetX = offsetX + touchX - startX;
          offsetY = offsetY + touchY - startY;

          setData();
        }
      }
    });

    svg.swipe({
      pinchStatus: function (event, phase, direction, distance , duration , fingerCount, pinchZoom) {
        if (phase === "cancel" || phase === "end") {
          offsetZoom = offsetZoom*zoom;

          setData();
        }
        else {
          zoom = pinchZoom;

          svg.css({transform: "scale(" + offsetZoom*zoom + ")"});
        }
      },
      fingers: 2,
      pinchThreshold: 0
    });

    function setData () {
      var offset = {
        x: offsetX - svg.width()*offsetZoom/2 + svg.width()/2,
        y: offsetY - svg.height()*offsetZoom/2 + svg.height()/2
      }
      doodle.setScale(offsetZoom);
      doodle.setOffset(offset);
      // data.scale = offsetZoom;
      // data.x = offsetX - svg.width()*offsetZoom/2 + svg.width()/2;
      // data.y = offsetY - svg.height()*offsetZoom/2 + svg.height()/2;
      // console.log(data);
    }
  }

  return {
    setDoodles: setDoodles,
  }
}
