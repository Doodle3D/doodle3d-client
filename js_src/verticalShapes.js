var VERTICALSHAPE;

var verticalShapes = {
  "NONE": 'none',
  "DIVERGING": 'diverging',
  "CONVERGING": 'converging',
  "SINUS": 'sinus'
};

function setVerticalShape(s) {
	VERTICALSHAPE = s;
  redrawRenderedPreview();
}

function initVerticalShapes() {
  resetVerticalShapes();
}

function resetVerticalShapes() {
  setVerticalShape(verticalShapes.NONE);
}