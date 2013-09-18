var VERTICALSHAPE;
var verticalShapes = {
  "NONE": 'none',
  "DIVERGING": 'diverging',
  "CONVERGING": 'converging',
  "SINUS": 'sinus'
};

function initVerticalShapes() {
  // TODO give these vertical shapes a better spot
  VERTICALSHAPE = verticalShapes.NONE;
  $(".verticalShapes, .straight").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("diverging");
    VERTICALSHAPE = verticalShapes.NONE;
    redrawRenderedPreview();
  })
  $(".verticalShapes, .diverging").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("diverging");
    VERTICALSHAPE = verticalShapes.DIVERGING;
    redrawRenderedPreview();
  })
  $(".verticalShapes, .converging").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("converging");
    VERTICALSHAPE = verticalShapes.CONVERGING;
    redrawRenderedPreview();
  })
  $(".verticalShapes, .sinus").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("sinus");
    VERTICALSHAPE = verticalShapes.SINUS;
    redrawRenderedPreview();
  })

}

function resetVerticalShapes() {
  VERTICALSHAPE = verticalShapes.NONE;
}