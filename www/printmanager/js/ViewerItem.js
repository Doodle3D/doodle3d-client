var ViewerItem = function(doodle) {

  var path = doodle.getPath();
  var svgData = doodle.getSvgPathDescription();
  var box = path.getBoundingBox();
  var svg = $('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="640" height="540"><path xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" d="'+svgData+'"></path></svg>');
  var viewbox = box.getX() + " " + box.getY() + " " + box.getWidth() + " " + box.getHeight();
  var xDown = 0, yDown = 0;
  var xCur = 0, yCur = 0;
  var dragging = false;
  var prevDist = 0;

  svg[0].setAttribute("viewBox", viewbox); //changig the viewBox with jQuery doesn't work (may be because of capital B)
  svg.attr('width',box.getWidth()+2);
  svg.attr('height',box.getHeight()+2);

  updateView();

  function updateView() {
    var box = path.getBoundingBox();
    var scaledCenterX = box.getCenter().x * (1-doodle.getScale());
    var scaledCenterY = box.getCenter().y * (1-doodle.getScale());
    svg[0].setAttribute("stroke-width", 1/doodle.getScale());
    svg.css({
      transform: "scale(" + doodle.getScale() + ")",
      left: doodle.getOffset().x - scaledCenterX + xCur - xDown,
      top: doodle.getOffset().y - scaledCenterY + yCur - yDown
    });
  }

  function getDoodle() {
    return doodle;
  }

  function getSvg() {
    return svg;
  }

  function startDrag(x,y) {
    if (!dragging) {
      dragging = true;
      xDown = x;
      yDown = y;
      updateDrag(x,y);
    }
  }

  function updateDrag(x,y) {
    xCur = x;
    yCur = y;
    updateView();
  }

  function stopDrag() {
    if (dragging) {
      dragging = false;
      doodle.getOffset().x += xCur - xDown;
      doodle.getOffset().y += yCur - yDown;
      xCur = 0;
      yCur = 0;
      xDown = 0;
      yDown = 0;
    }
  }

  function distance(x1,y1,x2,y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  function zoomBy(f) { 
    var newScale = doodle.getScale()+f;
    var box = path.getBoundingBox();
    var anchorpoint = box.getCenter();
    if (newScale*box.getWidth()<100) return;
    if (newScale*box.getHeight()<100) return;
    doodle.setScale(newScale);
    doodle.getOffset().x -= f*anchorpoint.x;
    doodle.getOffset().y -= f*anchorpoint.y;
    updateView();
  }

  svg.on("mousedown", function (e) {
    startDrag(e.originalEvent.pageX,e.originalEvent.pageY);
  });

  $(document).on("mousemove", function (e) {
    if (dragging) {
      updateDrag(e.originalEvent.pageX,e.originalEvent.pageY);
    }
  });

  svg.on("mouseup", function (e) {
    stopDrag();
  });

  $(document).on("mouseup", function (e) {
    stopDrag();
  });
  
  svg.on("touchstart", function (e) {
    var event = e.originalEvent;
    event.preventDefault();
    var touch = event.touches[0];
    startDrag(touch.pageX,touch.pageY); //drag
    if (event.touches.length === 2) { //zoom
      var touch2 = event.touches[1];
      prevDist = distance(touch.pageX,touch.pageY,touch2.pageX,touch2.pageY);
    }
  });

  svg.on("touchmove", function (e) {
    var event = e.originalEvent;
    event.preventDefault();
    if (dragging) {
      var touch = event.touches[0];
      updateDrag(touch.pageX,touch.pageY);
      if (event.touches.length === 2) {
        var touch2 = event.touches[1];
        var dist = distance(touch.pageX,touch.pageY,touch2.pageX,touch2.pageY);
        var scaler = (dist-prevDist) / 100; //100 is an arbitrary scaler
        zoomBy(scaler);
        prevDist = dist;
      }
    }
  });

  svg.on("touchend", function (e) {
    var event = e.originalEvent;
    stopDrag();
  });

  return {
    getDoodle: getDoodle,
    getSvg: getSvg,
  }
}