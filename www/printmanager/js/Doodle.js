var Doodle = function(svgData,settings) {

  var path = new Path();
  var height = 50; //in mm
  var offset = new Point(0,0);
  var scale = 1;
  var rotation = 0;
  var twist = 0;

  if (svgData!==undefined) {
    setFromSvgPathDescription(svgData);
    removeShortPaths(); //move this to main.js?

    //TODO: determine current offset from boundingbox and store in 'offset' variable
    path.alignCorner(); //set left-top corner of path boundingbox to 0,0
  }

  if (settings!==undefined) {
    if (settings.height!==undefined) height = settings.height;
    if (settings.twist!==undefined) twist = settings.twist;
  }

  function setFromSvgPathDescription(svgData) {
    // if (!svgData) svgData = "";
    // else if (typeof(svgData)!='string') svgData = "";
    // // else if (svgData.indexOf("CDATA")==-1) svgData = "";
    // else svgData = svgData.split('d="')[1].split('"')[0]; 

    console.log('svgData',svgData);

    svgData+=' '; //add a trailing space

    //Parse Path Description
    var mode = '', x=0, y=0, p=0;
    var path = new Path();

    var skipSpace = function() { 
      while (svgData.charAt(p) == ' ') p++; 
    }

    var parser = function() {
      while (true) {
        skipSpace();

        if (p==svgData.length) {
          return true;
        }

        var c = svgData.charAt(p);
        if (c == 'M' || c == 'm' || c == 'L' || c == 'l') { //new command letter
          mode = c;
        } else if (c == '"') { //end of command chain
          return true;
        } else { //something else, must be a pair of coordinates...
          var tx = 0, ty = 0, numberEnd = 0, len = 0;
          numberEnd = svgData.indexOf(',', p);

          ////// RC: if instead of a comma a space is used between a pair use that as a separator
          //var firstSpace = svgData.indexOf(' ', p);
          //if (firstSpace<numberEnd) numberEnd=firstSpace;   
          if (numberEnd == -1) { console.log("parsePathDescription:could not find *COMMA* in coordinate pair pos:",p,'of',svgData.length,svgData.substr(p)); return false; }
          len = numberEnd - p;
          tx = parseFloat(svgData.substr(p, len));
          p += len + 1;
          skipSpace();
          numberEnd = svgData.indexOf(' ', p);
          if (numberEnd == -1) { console.log("parsePathDescription:could not find *SPACE* after coordinate pair",p,'of',svgData.length); return false; }
          len = numberEnd - p;
          ty = parseFloat(svgData.substr(p, len));
          p += len;

          if (mode == 'M' || mode == 'L') {
            x = tx; y = ty;
          } else if (mode == 'm' || mode == 'l') {
            x += tx; y += ty;
          } else {
            console.log("parsePathDescription: found coordinate pair but mode was never set");
            return false;
          }

          var isMove = mode == 'm' || mode == 'M';

          if (isMove) path.moveTo(x,y);
          else path.lineTo(x,y);
        }
        p++;
      }
    }
    parser();
    setPath(path);
  }

  function getSvgPathDescription() {
    var d = "";
    var polylines = path.getPolylines();
    for (var i=0; i<polylines.length; i++) {
      var points = polylines[i].getPoints();
      for (var j=0; j<points.length; j++) {
        d += (j==0 ? "M" : "L");
        d += Math.round(points[j].x) + "," + Math.round(points[j].y) + " ";
      }
    }
    return d;
    // return '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="640" height="540"><path xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" stroke-width="2" d="'+d+'"></path></svg>';
  }

  function removeShortPaths(minLength,minPoints) {
    if (!minLength) minLength = 10;
    if (!minPoints) minPoints = 1;

    path.setPolylines(path.getPolylines().filter(function(polyline) {
      return polyline.getPoints().length>minPoints && polyline.getPerimeter()>minLength;
    }));
  }

  function getPath() {
    return path;
  }

  function setPath(newPath) {
    path = newPath
  }

  function getSettings() {
    return settings;
  }

  function getHeight() {
    return height;
  }

  function getTwist() {
    return twist;
  }

  function getScale() {
    return scale;
  }

  function setScale(_scale) {
    scale = _scale;
  }

  function getOffset() {
    return offset;
  }

  function setOffset(_offset) {
    offset = _offset;
  }

  function getRotation() {
    return rotation;
  }

  function getScaleFunction(f) {
    return 1; //Math.sin(f*2*Math.PI)/4+1;
  }
  
  return {
    getPath: getPath,
    setPath: setPath,
    getSettings: getSettings,
    setFromSvgPathDescription: setFromSvgPathDescription,
    getSvgPathDescription: getSvgPathDescription,
    getHeight: getHeight,
    getRotation: getRotation,
    getTwist: getTwist,
    getScaleFunction: getScaleFunction,
    getScale: getScale,
    setScale: setScale,
    getOffset: getOffset,
    setOffset: setOffset,
  }

}
  
