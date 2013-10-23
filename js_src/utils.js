
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
