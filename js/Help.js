/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var grandTour;
function GrandTour(_name) {
  //console.log("GrandTour");
  this.tour = "";
  this.name = _name;
  this.active = false;
  var self = this;

  this.init = function() {
    //console.log("GrandTour >> f:init()");

    this.tour = function() {
      $('#help_d3dIntro').joyride({
        autoStart: false,
        modal: true,
        expose: true,
        'tipAdjustmentX': 15,
        'tipAdjustmentY': 15,
        'tipLocation': 'bottom',         // 'top' or 'bottom' in relation to parent
        'nubPosition': 'auto',           // override on a per tooltip bases
        'scrollSpeed': 300,              // Page scrolling speed in ms
        //      'timer': 2000,                   // 0 = off, all other numbers = time(ms)
//        'startTimerOnClick': true,       // true/false to start timer on first click
        'nextButton': true,              // true/false for next button visibility
        'tipAnimation': 'fade',           // 'pop' or 'fade' in each tip
//        'pauseAfter': [],                // array of indexes where to pause the tour after
        'tipAnimationFadeSpeed': 350,    // if 'fade'- speed in ms of transition
//        'cookieMonster': true,           // true/false for whether cookies are used
//        'cookieDomain': false,           // set to false or yoursite.com
//        'cookieName': 'Doodle3DFirstTime',         // choose your own cookie name
        //      'localStorage': true,         //
        //      'localStorageKey': 'Doodle3DFirstTime',         // choose your own cookie name
        'preRideCallback' : self.preRideCallback,
        'preStepCallback': self.preStepCallback,       // A method to call before each step
        'postStepCallback': self.postStepCallback,       // A method to call after each step
        'postRideCallback': self.postRideCallback        // a method to call once the tour closes
      });
    };
    this.tour();
  };

  this.preRideCallback = function(index, tip) {
    //console.log("GrandTour >> f:preRideCallback() >> index: " + index);
    if (index == 0 && $.cookie("Doodle3DFirstTime") == "ridden") {
      //console.log("GrandTour >> f:preRideCallback() >> we've been here before...");

      if ($.cookie("grandTourFinished")) {
        // grand tour was previously finished (eh.. is that useful?)

        // executing this 3 times because there doesn't seem to be a 'go to step X' method
//        $(this).joyride('set_li', false);
        $(this).joyride('set_li', false);
//        $(this).joyride('set_li', false);
      } else {
        $(this).joyride('set_li', false);
      }
    }
    
    // Overrule printer to tour mode, pausing status updates
    printer.overruleState(Printer.TOUR_STATE);
    
    // bring up thermometer and progressbar to explain them
    thermometer.show();
    progressbar.show();
    message.hide();
  };
  this.preStepCallback = function(index, tip) {
//    console.log("GrandTour >> f:preStepCallback() >> index: " + index);
//    console.log("GrandTour >> f:preStepCallback() >> tip: " , tip);
//    console.log("GrandTour >> f:preStepCallback() >> $(this): " , $(this));
//    console.log("GrandTour >> f:preStepCallback() >> tipsettings: " , $(this)[0].tipSettings);

    var dataset = $(this)[0].$li[0].dataset;
    if (dataset.action != undefined) {
      switch (dataset.action) {
        case "showMessage":
          //console.log("    action: showMessage");
          message.set("This is a status message...", Message.NOTICE);
          break;
      }
    }
  };
  this.postStepCallback = function(index, tip) {
    //console.log("GrandTour >> f:postStepCallback() >> index: " + index);
   // var dataset = $(this)[0].$li[0].dataset;
  };
  this.postRideCallback = function(index, tip) {
//    console.log("GrandTour >> f:postRideCallback() >> index: " + index + ", self.active: " + self.active);
//    console.log("GrandTour >> f:postRideCallback() >> this: " , self);

    self.active = false;

    $(document).trigger(helpTours.TOURFINISHED, self.name);

    // hide the elements which were summoned for the purposes of the tour
//    thermometer.hide();
//    progressbar.hide();
//    message.hide();

    // after seeing the grand tour for the first time ever, set cookie 'Doodle3DFirstTime' to true
    if (!$.cookie("Doodle3DFirstTime")) {
      $.cookie("Doodle3DFirstTime", 'ridden', { expires: 365, domain: false, path: '/' });
    }

    if (index < $(this)[0].$tip_content.length - 1) {
      //console.log("GrandTour >> f:postRideCallback() >> tour terminated before its true end");
      // tour wasn't finished

      // tour was ended prematurely. For only the first few visits, nag the user about being able to revisit the tour..
      if (parseInt($.cookie("Doodle3DVisitCounter")) < helpTours.numTimesToShowNagPopup) {
        helpTours.startTour(helpTours.INFOREMINDER, helpTours);
      }
//      infoReminderTour.start();
    } else {
      // tour was finished
      //console.log("GrandTour >> f:postRideCallback() >> tour ended at its true end");
      // we should be at the end...
      if (!$.cookie("grandTourFinished") && parseInt($.cookie("Doodle3DVisitCounter")) < helpTours.numTimesToShowNagPopup) {
        helpTours.startTour(helpTours.INFOREMINDER, helpTours);
      }
      $.cookie("grandTourFinished", 'yes', { expires: 365, domain: false, path: '/' });
    }

  };

  this.start = function() {
    //console.log("GrandTour >> f:start() >> this: " , this);
    this.active = true;
    $(window).joyride('restart');
//    self.tour();
  };
}

var infoReminderTour;
function InfoReminderTour(_name) {
  //console.log("InfoReminderTour");
  this.tour = "";
  this.name = _name;
  this.active = false;
  var self = this;

  this.init = function(callback) {
    //console.log("InfoReminderTour >> f:init()");

    this.tour = function() {
      $('#help_InfoReminder').joyride({
        autoStart: false,
        modal: true,
        expose: true,
        'tipAdjustmentX': 15,
        'tipAdjustmentY': 15,
        'tipLocation': 'bottom',         // 'top' or 'bottom' in relation to parent
        'nubPosition': 'auto',           // override on a per tooltip bases
        'scrollSpeed': 300,              // Page scrolling speed in ms
        'nextButton': true,              // true/false for next button visibility
        'tipAnimation': 'fade',           // 'pop' or 'fade' in each tip
        'tipAnimationFadeSpeed': 350,    // if 'fade'- speed in ms of transition
        'preRideCallback' : self.preRideCallback,
        'postStepCallback': self.postStepCallback,       // A method to call after each step
        'postRideCallback': self.postRideCallback        // a method to call once the tour closes
      });
    }
    this.tour();
    if (callback != undefined) callback();
  };

  this.preRideCallback = function(index, tip) {
    //console.log("InfoReminderTour >> f:preRideCallback() >> index: " + index + ", tip: " , tip);
  };
  this.postStepCallback = function(index, tip) {
    //console.log("InfoReminderTour >> f:postStepCallback() >> index: " + index + ", tip: " , tip);
  };
  this.postRideCallback = function(index, tip) {
    //console.log("InfoReminderTour >> f:postRideCallback() >> index: " + index + ", tip: " , tip);
    this.active = false;
    $(document).trigger(helpTours.TOURFINISHED, self.name);
  };

  this.start = function() {
    //console.log("InfoReminderTour >> f:start()");
    this.active = true;
    $(window).joyride('restart');
//    self.tour();
  };
}

function initHelp() {
  //console.log("f:initHelp()");

  // track number of visits of this user
  if ($.cookie("Doodle3DVisitCounter") == null) {
    $.cookie("Doodle3DVisitCounter", '0');
  } else {
    $.cookie("Doodle3DVisitCounter", parseInt($.cookie("Doodle3DVisitCounter")) + 1);
  }

  // load the html file which describes the tour contents
  $("#helpContainer").load("helpcontent.html", function() {
    //console.log("helpContent loaded");

    helpTours = new HelpTours();

    helpTours.init( function () {


      if (parseInt($.cookie("Doodle3DVisitCounter")) < helpTours.numTimesToShowNagPopup) {
        //console.log("initHelp >> Doodle3DFirstTime cookie is set, Doodle3DVisitCounter is < 4");
        if ($.cookie("Doodle3DFirstTime") != "ridden") {
          setTimeout(helpTours.startTour, 750, helpTours.tours.grandTour, helpTours);
        } else {
          setTimeout(helpTours.startTour, 750, helpTours.tours.infoReminderTour, helpTours);
        }
        // remind user of our nifty tour
      } else if (parseInt($.cookie("Doodle3DVisitCounter")) == helpTours.numTimesToShowNagPopup && $.cookie("Doodle3DFirstTime") != "ridden") {
        // remind
        setTimeout(helpTours.startTour, 750, helpTours.tours.infoReminderTour, helpTours);
      }
//            // only trigger starttour if user is seeing Doodle3D for the first time
//      if ($.cookie("Doodle3DFirstTime") != "ridden") {
//        console.log("initHelp >> intro tour has not been given yet > let's go!");
//        setTimeout(helpTours.startTour, 750, helpTours.tours.grandTour, helpTours);
//      } else if (parseInt($.cookie("Doodle3DVisitCounter")) < helpTours.numTimesToShowNagPopup) {
//        console.log("initHelp >> Doodle3DFirstTime cookie is set, Doodle3DVisitCounter is < 4");
//        // remind user of our nifty tour
//        setTimeout(helpTours.startTour, 750, helpTours.tours.infoReminderTour, helpTours);
//      }
    });
  });

}

var helpTours;
function HelpTours() {
  //console.log("HelpTours");

  this.numTimesToShowNagPopup = 2;

  this.WELCOMETOUR    = "welcometour";
  this.INFOREMINDER   = "inforeminder";
  this.TOURFINISHED   = "tourfinished";
  this.tours = {
    'grandTour'           : this.WELCOMETOUR,
    'infoReminderTour'    : this.INFOREMINDER
  };

  this.currActiveTour = "";
  this.tourActive = false;

  var self = this;

  this.init = function(callback) {
    //console.log("HelpTours >> f:init >> self: " + self);
    $(document).on(this.TOURFINISHED, this.tourEnded);

    grandTour = new GrandTour(this.WELCOMETOUR);
    infoReminderTour = new InfoReminderTour(this.INFOREMINDER);

//    this.tours["grandTour"] = self.WELCOMETOUR;
//    this.tours["infoReminderTour "]= self.INFOREMINDER;
    //console.log("HelpTours >> f:init >> this.tours: " , this.tours);

    if (callback != undefined) callback();
  };


  this.startTour = function(which, scope) {
    if (scope == undefined) scope = this;
//    console.log("HelpTours >> f:startTour >> scope: " , scope);
//    console.log("HelpTours >> f:startTour >> currActiveTour: " , scope.currActiveTour.name);
//    console.log("HelpTours >> f:startTour >> currActiveTour.active: " , scope.currActiveTour.active);
//    console.log("HelpTours >> f:startTour >> target to start: '" + which);


    switch (which) {
      case scope.WELCOMETOUR:
        // do welcometour
        //console.log("HelpTours >> f:startTour >> case this.WELCOMETOUR >> scope.tourActive = " + scope.tourActive);
        //console.log("HelpTours >> f:startTour >> case this.WELCOMETOUR");
        if (scope.tourActive) {
          if (scope.currActiveTour.active == true) {
            $(window).joyride('end');
            scope.currActiveTour = undefined;
          }
          scope.tourActive = false;
        }
        $(window).joyride('destroy');
//        var self = this;
          grandTour.init();
        setTimeout(function(scp) {
          grandTour.start();
          scp.currActiveTour = grandTour;
          scp.tourActive = true;
        }, 250, scope);
//        $(window).joyride('restart');

        break;
      case self.INFOREMINDER:
        // do info reminder
//      console.log("HelpTours >> f:startTour >> case self.INFOREMINDER >> scope.tourActive = " + scope.tourActive);
        //console.log("HelpTours >> f:startTour >> case self.INFOREMINDER");
        if (scope.tourActive) {
//          console.log("    killing previous joyride... ");
          if (scope.currActiveTour.active == true) {
            $(window).joyride('end');
            scope.currActiveTour = undefined;
          }
//          console.log("    setting tourActive to false....");
          scope.tourActive = false;
//          console.log("    scope.tourActive: " + scope.tourActive);
        }
        $(window).joyride('destroy');
//        var self = this;
          infoReminderTour.init();
        setTimeout(function(scp) {
          infoReminderTour.start();
          scp.currActiveTour = infoReminderTour;
          scp.tourActive = true;
        }, 250, scope);

        break;
    }
  }

  this.tourEnded = function(e, n) {
    //console.log("HelpTours >> f:tourEnded >> self.tourActive: " + self.tourActive + ", name: " + n);

    $(window).joyride('destroy');
    self.currActiveTour = undefined;
    self.tourActive = false;

    message.hide();
    printer.checkStatus();
  }
}
