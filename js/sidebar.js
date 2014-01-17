/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var sidebarLeft;
var sidebarRight;

function initSidebars() {
  console.log("f:initSidebars()");

  sidebarLeft = new SideBar();
  sidebarLeft.init("#leftpanel", "hideleft", function() {
    $("#leftpanel").show();
  });

  sidebarRight = new SideBar();
  sidebarRight.init("#rightpanel", "hideright", function() {
    $("#rightpanel").show();
  });
}

function SideBar() {
  this.initted = false;
  this.$contentTarg = undefined;
  this.$sideBtn = undefined;
  this.contentHidden = false;
  this.hideClass = "";

  this.init = function(targ, hideClass, callback) {
    console.log("SideBar >> f:init >> targ: " , $(targ) , ", hideClass: " + hideClass);
    this.$contentTarg = $(targ);
    this.hideClass = hideClass;

    this.$contentTarg.addClass(this.hideClass);
    this.contentHidden = true;

    this.$contentTarg.append("<div class='sidebutton'></div>");
    this.$sideBtn = $(targ +" .sidebutton");
    var self = this;

    this.$sideBtn.on('click', function(e) {
      console.log("sidebutton");
      self.toggleShowHide();
    });

    this.initted = true;

    callback();
  }

  this.toggleShowHide = function() {
    if (this.contentHidden) {
      this.contentHidden = false;
      this.$contentTarg.removeClass(this.hideClass);
      //        self.$sideBtn.addClass("sidebuttonin");
      this.$sideBtn.addClass("sidebuttonin");
    } else {
      this.contentHidden = true;
      this.$contentTarg.addClass(this.hideClass);
      //        self.$sideBtn.removeClass("sidebuttonin");
      this.$sideBtn.removeClass("sidebuttonin");

    }
  }
}

