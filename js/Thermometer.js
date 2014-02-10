/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

// TODO assess if this var is still necessary
var $displayThermometer = $("#thermometerContainer");


//TODO 2013-09-18 allow displaying temperatures HIGHER than the targTemp (it's now being capped at targTemp).
function Thermometer() {
  this.currentTemperature = 0; // default val
  this.targetTemperature = 0; // default val

  this.thermoOverlayImg = new Image();
  this.thermoOverlayImgSrc = "img/thermometer_fg_overlay.png"; // ../img/thermometer_fg_overlay.png

  this.thermoWidth= 40;
  this.thermoHeight = 100;

  this.$canvas;
  this.canvas;
  this.context;
  this.$container;
  
  this.isInitted = false;
  
  this.enabled = true;
  
  this.thermoColors = [
    [50, 200, 244], // 'cold'
    [244, 190, 10], // 'warming up'
    [244, 50, 50]   // 'ready / hot'
  ];

  this.init = function(targCanvas, targCanvasContainer) {
    //console.log("Thermometer.init()");

    this.$container = targCanvasContainer;

    this.$canvas = targCanvas;
    this.canvas = this.$canvas[0];
    this.context = this.canvas.getContext('2d');


    var self = this;
    this.thermoOverlayImg.onload = function() {
      //console.log("canvasThermoOverlay img loaded");
      self.isInitted = true;
      self.update(self.currentTemperature, self.targetTemperature);
    };
    this.thermoOverlayImg.src = this.thermoOverlayImgSrc;
  }

  this.update = function(curr, targ) {
    //      console.log("Thermometer.update(" + curr + "," + targ + ")");

    if (this.isInitted) {
    	if(!this.enabled) return;
      if (curr == undefined) curr = 0;
      if (targ== undefined) targ = 180; // prevent divide by zero

      var progress = curr / targ;

//      progress = Math.min(progress, 1.0);
      progress = Math.max(progress, 0);

      var h = this.thermoHeight; // 94 // px
      var paddingUnder = 15; // how far is beginpoint from bottom of thermometer
      var paddingAbove = 25; // how far is endpoint from top of thermometer
      var endPoint = h * .8;
      var p = Math.floor((h - paddingUnder - paddingAbove) * progress); // %
      //    var tempHeight =

      var currColor = this.thermoColors[0];
      if (progress > 0.98) {
        currColor = this.thermoColors[2];
      } else if (progress > 0.25) {
        currColor = this.thermoColors[1];
      }

      // clear
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.font = "10pt sans-serif";

      // draw the thermometer clipping path
      this.context.save();
      this.context.beginPath();
      this.context.arc(40, 80, 16, 0, 2 * Math.PI, false); // circle bottom of thermometer
      this.context.arc(40, 10, 4, 0, 2 * Math.PI, false); // circle at top of thermometer tube
      this.context.rect(36, 11, 8, 70); // thermometer tube
      this.context.fillStyle = '#fff';
      this.context.fill();
      this.context.clip();

      // draw rectangle which represents temperature
      // rect will be clipped by the thermometer outlines
      this.context.beginPath();
      this.context.rect(20, h - paddingUnder - p, 60, p + paddingUnder);
      //console.log("   currColor: " + currColor);
      //todo Math.floor??
      this.context.fillStyle = "rgb(" + currColor[0] + "," + currColor[1] + "," + currColor[2] + ")";
      this.context.fill();
      this.context.restore();

      // additional text labels
      this.context.save();
      this.context.beginPath();
      this.context.moveTo(32, paddingAbove);
      this.context.lineTo(52, paddingAbove);
      this.context.lineWidth = 2;
      this.context.strokeStyle = '#000';
      this.context.stroke();
      this.context.fillStyle = '#000';
      this.context.textAlign = "left";
      this.context.textBaseline = "middle";
      this.context.fillText(targ + "°", 55, paddingAbove);
      this.context.restore();

      // the thermometer outline png
      this.context.drawImage(this.thermoOverlayImg, 20, 0);

      // text
      this.context.fillStyle = '#000';
      this.context.textAlign="center";
      this.context.fillText(curr + "°", 40, h + paddingUnder);
    } else {
      console.log("Thermometer.setTemperature() -> thermometer not initialized!");
    }
  }
  this.show = function() {
    this.$container.addClass("thermometerAppear");
//    $("#progressbarCanvasContainer").addClass("thermometerAppear");
//  	this.$container.show();
  	this.enabled = true;
  }
  this.hide = function() {
    this.$container.removeClass("thermometerAppear");
//    $("#progressbarCanvasContainer").removeClass("thermometerAppear");
//  	this.$container.hide();
  	this.enabled = false;
  }
}
