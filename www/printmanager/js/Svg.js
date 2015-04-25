// var Svg = function() {
  
//   // var pathElement;
//   var svgElement;
//   var path;

//   this.load = function(svgData) {

//     if (!svgData) svgData = "";
//     else if (typeof(svgData)!='string') svgData = "";
//     // else if (svgData.indexOf("CDATA")==-1) svgData = "";
//     else svgData = svgData.split('d="')[1].split('"')[0]; 

//     svgElement = $('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="640" height="540"><path xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" stroke-width="2" d="'+svgData+'"></path></svg>');

//     var pathElement = $(svgElement).find('path');
//     var pathDescription = pathElement.attr('d');
//     var path = parsePathDescription(pathDescription);
//     var box = path.getBoundingBox();

//     console.log(box.toString());

//     var polylines = path.getPolylines();
//     for (var i=0; i<polylines.length; i++) {
      
//       var len = polylines[i].getPerimeter();
//       // console.log(i,len,);
//       if (len<10 || polylines[i].getPoints().length<6) {
//         console.log('removing polyline ',i);
//         polylines.splice(i,1);
//       }
//     }

//     var box = path.getBoundingBox();

//     path.translate(-box.getX()+1,-box.getY()+1);

//     svgElement.attr('width',box.getWidth()+2);
//     svgElement.attr('height',box.getHeight()+2);


//     // var indices = path.getPointIndicesByDistance(367,433,50);
//     // console.log('indices',indices);

//     // svgElement.append('<circle xmlns="http://www.w3.org/2000/svg" version="1.1" cx="60" cy="60" r="50"/>');

//     // var points = path.getPoints();
//     // for (var i=0; i<points.length; i++) {
//     //   path.removePoint(i);
//     //   if (i>400) break;
//     // }

//     // console.log(points.length);

//     // console.log(path.getPoints().length);
    

//     // path.removePoint(502);
//     // path.removePoint(503);
//     var d = getPathDescription(path);
//     pathElement.attr('d',d); //update
//   }

//   function getPathDescription(path) {
//     var d = "";
//     var polylines = path.getPolylines();
//     for (var i=0; i<polylines.length; i++) {
//       var points = polylines[i].getPoints();
//       for (var j=0; j<points.length; j++) {
//         // console.log(i,points.length);
//         d += (j==0 ? "M" : "L");
//         d += Math.round(points[j].x) + "," + Math.round(points[j].y) + " ";
//       }
//     }
//     return d;
//   }

//   function parsePathDescription(svgData) {
//     var mode = '', x=0, y=0, p=0;
//     var path = new Path();

//     var skipSpace = function() { 
//       while (svgData.charAt(p) == ' ') p++; 
//     }

//     var parser = function() {
//       while (true) {
//         skipSpace();

//         if (p==svgData.length) {
//           return true;
//         }

//         var c = svgData.charAt(p);
//         if (c == 'M' || c == 'm' || c == 'L' || c == 'l') { //new command letter
//           mode = c;
//         } else if (c == '"') { //end of command chain
//           return true;
//         } else { //something else, must be a pair of coordinates...
//           var tx = 0, ty = 0, numberEnd = 0, len = 0;
//           numberEnd = svgData.indexOf(',', p);

//           ////// RC: if instead of a comma a space is used between a pair use that as a separator
//           var firstSpace = svgData.indexOf(' ', p);
//           if (firstSpace<numberEnd) numberEnd=firstSpace;   
//           if (numberEnd == -1) { console.log("parsePathDescription:could not find *COMMA* in coordinate pair"); return false; }
//           len = numberEnd - p;
//           tx = parseFloat(svgData.substr(p, len));
//           p += len + 1;
//           skipSpace();
//           numberEnd = svgData.indexOf(' ', p);
//           if (numberEnd == -1) { console.log("parsePathDescription:could not find *SPACE* after coordinate pair"); return false; }
//           len = numberEnd - p;
//           ty = parseFloat(svgData.substr(p, len));
//           p += len;

//           if (mode == 'M' || mode == 'L') {
//             x = tx; y = ty;
//           } else if (mode == 'm' || mode == 'l') {
//             x += tx; y += ty;
//           } else {
//             console.log("parsePathDescription: found coordinate pair but mode was never set");
//             return false;
//           }

//           var isMove = mode == 'm' || mode == 'M';

//           if (isMove) path.moveTo(x,y);
//           else path.lineTo(x,y);
//         }
//         p++;
//       }
//     }

//     parser();

//     return path;
//   }


//   this.getElement = function() {
//     return svgElement;
//   }

//   this.getPath = function() {

//   }

// }