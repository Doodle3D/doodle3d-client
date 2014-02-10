/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function Progressbar() {
  this.currProgress = 0; // default val

  this.progressbarFGImg = new Image();
  this.progressbarFGImgSrc = "img/progress_fg.png";
  this.progressbarBGImg = new Image();
  this.progressbarBGImgSrc = "img/progress_bg.png";

  this.progressWidth= 93;
  this.progressHeight = 82;

  this.quartPI = .5 * Math.PI;
  this.twoPI = 2 * Math.PI;

  // To make the progressbar start with a minimal amount of 'progress'
  // so that you can visually see that there is progress
  this.progressPadding = Math.PI * .1;

  this.$canvas;
  this.canvas;
  this.context;
  this.$container;

  this.isInitted = false;

  this.enabled = true;

  this.init = function(targCanvas, targCanvasContainer) {
    console.log("Thermometer.init()");

    this.$container = targCanvasContainer;

    this.$canvas = targCanvas;
    this.canvas = this.$canvas[0];
    this.context = this.canvas.getContext('2d');


    var self = this;
    this.progressbarBGImg.onload = function() {
      //console.log("progressbarBGImg img loaded");
      //        self.isInitted = true;
      //        self.update(self.currentTemperature, self.targetTemperature);

      self.progressbarFGImg.onload = function() {
        console.log("progressbarFGImg img loaded");
        self.isInitted = true;
        self.update(0, 100);
      };
      self.progressbarFGImg.src = self.progressbarFGImgSrc;
    };
    this.progressbarBGImg.src = this.progressbarBGImgSrc;
  }

  this.update = function(part, total) {
    //console.log("Progressbar.update(" + part + "," + total + ")");

    var pct = part / total;
    if (this.isInitted) {
      if (part == undefined) part = 0;
      if (total== undefined) total = 100; // prevent divide by zero

      var progress = part / total;
      progress = Math.min(progress, 1.0);
      progress = Math.max(progress, 0);
      //console.log("progressbar >> f:update() >> progress: " + progress);

      // clear
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.context.drawImage(this.progressbarBGImg, 0, 0);

      this.context.font = "7pt sans-serif";

      // draw the progressbar foreground's clipping path
      this.context.save();
      this.context.beginPath();
      this.context.moveTo(45, 45);
      this.context.lineTo(45, 0);
      this.context.arc(45, 45, 45, -this.quartPI, -this.quartPI + this.progressPadding + (progress * (this.twoPI - this.progressPadding)), false); // circle bottom of thermometer
      this.context.lineTo(45, 45);
      this.context.clip();

      this.context.drawImage(this.progressbarFGImg, 0, 0);
      this.context.restore();

      if (debugMode) {
        this.context.fillStyle = '#222';
        this.context.strokeStyle = '#fff';
        this.context.lineWidth = 3;
        this.context.textAlign="center";
        this.context.strokeText(part + " / " + total, 45, 45, 90);
        this.context.fillText(part + " / " + total, 45, 45, 90);
      }

    } else {
      console.log("Progressbar.setTemperature() -> thermometer not initialized!");
    }
  }
  this.show = function() {
    this.$container.addClass("progressbarAppear");
    //  	this.$container.show();
    this.enabled = true;
  }
  this.hide = function() {
    this.$container.removeClass("progressbarAppear");
    //  	this.$container.hide();
      this.enabled = false;
  }
}
