/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

// http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
function getURLParameter(name) {
  return decodeURI(
    (new RegExp('[&?]'+name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
  );
}

// returns true for all smartphones and tablets
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Mobile/i.test(navigator.userAgent);
}

// returns true for smartphones (Android will be a bit dodgy (tablet or phone, all depends on pixels vs devicePixelRatio...)
function isSmartphone() {
  var returnBool = false;
  if( /Android/i.test(navigator.userAgent) && window.devicePixelRatio > 1) {
    var w = $(window).width() / window.devicePixelRatio;
    console.log("Android device >> ratio'd width: " + w);
    if (w < 480) {
      returnBool = true;
    }
  } else {
    returnBool = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Windows Mobile/i.test(navigator.userAgent)
  }

  return returnBool;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}
