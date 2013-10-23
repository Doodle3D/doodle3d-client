
var grandTour;
function GrandTour(_name) {
  console.log("GrandTour");
  this.tour = "";
  this.name = _name;
  var self = this;

  this.init = function() {
    console.log("GrandTour >> f:init()");

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
        'startTimerOnClick': true,       // true/false to start timer on first click
        'nextButton': true,              // true/false for next button visibility
        'tipAnimation': 'fade',           // 'pop' or 'fade' in each tip
        'pauseAfter': [],                // array of indexes where to pause the tour after
        'tipAnimationFadeSpeed': 250,    // if 'fade'- speed in ms of transition
//        'cookieMonster': true,           // true/false for whether cookies are used
//        'cookieDomain': false,           // set to false or yoursite.com
//        'cookieName': 'Doodle3DFirstTime',         // choose your own cookie name
        //      'localStorage': true,         //
        //      'localStorageKey': 'Doodle3DFirstTime',         // choose your own cookie name
        'preRideCallback' : self.preRideCallback,
        'postStepCallback': self.postStepCallback,       // A method to call after each step
        'postRideCallback': self.postRideCallback        // a method to call once the tour closes
      });
    };
    this.tour();
  };

  this.preRideCallback = function(index, tip) {
    console.log("GrandTour >> f:preRideCallback() >> index: " + index);
    if ($.cookie("Doodle3DFirstTime") == "ridden" && index == 0) {
      console.log("we've been here before...");
      //    $(this).joyride('set_li', false, 1);
    }
        if ($.cookie("Doodle3DFirstTime") == 'ridden') {
          console.log("we've been here before...");
          $(this).joyride('set_li', false);
        }
    //    if (index == 0) {
    //      console.log("...yeah");
    //      $(this).joyride('set_li', false, 1);
    //    }
  };
  this.postStepCallback = function(index, tip) {
    console.log("GrandTour >> f:postStepCallback() >> index: " + index);
  };
  this.postRideCallback = function(index, tip) {
    console.log("GrandTour >> f:postRideCallback() >> index: " + index);

    $(document).trigger(helpTours.TOURFINISHED, self.name);

    if (index < $(this)[0].$tip_content.length - 1) {
      console.log("doPostRideCallback >> ENDED BEFORE END");
      helpTours.startTour(helpTours.INFOREMINDER);
//      infoReminderTour.start();
    } else {
      console.log("doPostRideCallback >> this is the end my friend...");
      // we should be at the end...
      $.cookie("Doodle3DFirstTime", 'ridden', { expires: 365, domain: false, path: '/' });
    }

  };

  this.start = function() {
    console.log("GrandTour >> f:start()");
    $(window).joyride('restart');
//    self.tour();
  };
}

var infoReminderTour;
function InfoReminderTour(_name) {
  console.log("InfoReminderTour");
  this.tour = "";
  this.name = _name;
  var self = this;

  this.init = function(callback) {
    console.log("InfoReminderTour >> f:init()");

    this.tour = function() {
      $('#help_InfoReminder').joyride({
        autoStart: false,
        modal: true,
        expose: true,
        'tipAdjustmentX': 15,
        'tipAdjustmentY': 15,
        'tipLocation': 'left',         // 'top' or 'bottom' in relation to parent
        'nubPosition': 'auto',           // override on a per tooltip bases
        'scrollSpeed': 300,              // Page scrolling speed in ms
        'nextButton': true,              // true/false for next button visibility
        'tipAnimation': 'fade',           // 'pop' or 'fade' in each tip
        'tipAnimationFadeSpeed': 250,    // if 'fade'- speed in ms of transition
        'preRideCallback' : self.preRideCallback,
        'postStepCallback': self.postStepCallback,       // A method to call after each step
        'postRideCallback': self.postRideCallback        // a method to call once the tour closes
      });
    }
    this.tour();
    if (callback != undefined) callback();
  };

  this.preRideCallback = function(index, tip) {
    console.log("InfoReminderTour >> f:preRideCallback() >> index: " + index + ", tip: " , tip);
  };
  this.postStepCallback = function(index, tip) {
    console.log("InfoReminderTour >> f:postStepCallback() >> index: " + index + ", tip: " , tip);
  };
  this.postRideCallback = function(index, tip) {
    console.log("InfoReminderTour >> f:postRideCallback() >> index: " + index + ", tip: " , tip);
    $(document).trigger(helpTours.TOURFINISHED, self.name);
  };

  this.start = function() {
    console.log("InfoReminderTour >> f:start()");
    $(window).joyride('restart');
//    self.tour();
  };
}

function initHelp() {
  console.log("f:initHelp()");



//  grandTour = new GrandTour();
//  infoReminderTour = new InfoReminderTour();

  // first call inits the tour
//  joyride2();

  $("#helpContainer").load("helpcontent.html", function() {
    console.log("helpContent loaded");
    helpTours = new HelpTours();
    helpTours.init();

//    grandTour.init();
////    infoReminderTour.init();
//
//    if ($.cookie("Doodle3DFirstTime") != "ridden") {
//      console.log("intro tour has not been given yet > let's go!");
//      setTimeout(grandTour.start, 1000);
//    }
  });

}

var helpTours;
function HelpTours() {
  console.log("HelpTours");

  this.WELCOMETOUR    = "welcometour";
  this.INFOREMINDER   = "inforeminder";
  this.TOURFINISHED   = "tourfinished";

  this.tourActive = false;

  var self = this;

  this.init = function() {
    console.log("HelpTours >> f:init");
    $(document).on(this.TOURFINISHED, this.tourEnded);

    grandTour = new GrandTour(this.WELCOMETOUR);
    infoReminderTour = new InfoReminderTour(this.INFOREMINDER);

    if ($.cookie("Doodle3DFirstTime") != "ridden") {
      console.log("HelpTours >> f:init >> intro tour has not been given yet > let's go! (this.WELCOMETOUR = " + this.WELCOMETOUR + ")");
      setTimeout(this.startTour, 1000, this.WELCOMETOUR);
    }
  };


  this.startTour = function(which) {
    console.log("HelpTours >> f:startTour >> target to start: '" + which);
    switch (which) {
      case self.WELCOMETOUR:
        // do welcometour
        console.log("HelpTours >> f:startTour >> case this.WELCOMETOUR >> self.tourActive = " + self.tourActive);
        if (this.tourActive) {
          $(window).joyride('end');
          this.tourActive = false;
        }
        $(window).joyride('destroy');
        grandTour.init();
        grandTour.start();
        this.tourActive = true;
//        $(window).joyride('restart');

        break;
      case self.INFOREMINDER:
        // do info reminder
        console.log("HelpTours >> f:startTour >> case self.INFOREMINDER >> self.tourActive = " + self.tourActive);
        if (this.tourActive) {
          $(window).joyride('end');
          this.tourActive = false;
        }
        $(window).joyride('destroy');
        infoReminderTour.init();
        infoReminderTour.start();
        this.tourActive = true;

        break;
    }
  }

  this.tourEnded = function(e, n) {
    console.log("HelpTours >> f:tourEnded >> name: " + n);

    this.tourActive = false;
  }
}