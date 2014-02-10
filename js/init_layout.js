/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

// TODO refactor this stuff, there's much to wipe
var drawAreaContainerMinHeight = 300;
var drawAreaContainerMaxHeight = 450;

function doOnResize() {
  //    console.log("doOnResize() >> " + new Date().getTime());
  canvas.width = $canvas.width();
  canvas.height = $canvas.height(); // canvas.clientHeight;

  preview.width = $preview.width();
  preview.height = $drawAreaContainer.height();

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

//  console.log("   preview.width: " + preview.width + ", $preview.width(): " + $preview.width());

  calcPreviewCanvasProperties();

  drawCanvasTopLeftCoords[0] = drawCanvas.offset().left;
  drawCanvasTopLeftCoords[1] = drawCanvas.offset().top;

  redrawDoodle();
  redrawPreview();
}

function initLayouting() {
  //console.log("f:initLayouting()");

  $drawAreaContainer = $("#drawareacontainer");

  canvas.width = $canvas.width();
  canvas.height = $canvas.height(); // canvas.clientHeight;

  preview.width = $preview.width();
  preview.height = $drawAreaContainer.height();

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

  $drawAreaContainer.show();

  // window.innerHeight
  //console.log("window.innerHeight: " + window.innerHeight);
  //console.log("window.innerWidth: " + window.innerWidth);
  //console.log("$drawAreaContainer.innerHeight(): " + $drawAreaContainer.innerHeight());
  //console.log("$drawAreaContainer.offset().top: " + $drawAreaContainer.offset().top);

  // timeout because it SEEMS to be beneficial for initting the layout
  // 2013-09-18 seems beneficial since when?
  setTimeout(_startOrientationAndChangeEventListening, 1000);
}

function _startOrientationAndChangeEventListening() {
  // Initial execution if needed

  $(window).on('resize', doOnResize);

  // is it necessary to call these? Aren't they called by the above eventhandlers?
  doOnResize();
}
