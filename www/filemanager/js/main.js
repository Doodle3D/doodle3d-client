/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2014, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

// http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
function getURLParameter(name) {
  return decodeURI((new RegExp('[&?]'+name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
}

var wifiboxURL = "";

if (getURLParameter("r") != "null") wifiboxURL = 'http://192.168.5.1';
if (getURLParameter("wifiboxURL") != "null") wifiboxURL = getURLParameter("wifiboxURL");

var api = wifiboxURL+'/d3dapi/sketch/';

$("#logo").click(onLogoClick)
$("#btnDelete").click(deleteSelectedSketches);
$("#btnSelectAll").click(selectAll);
$("#btnDeselectAll").click(deselectAll);
$("#uploads").change(upload);
$("#btnDownload").click(download);
$("#btnPancake").click(pancake);

$("#btnUpload").click(function(e) {
  e.preventDefault();
  $("#uploads").trigger('click');
});

var isBusy = true;

updateButtonStates();

$.get(api+'list', function(data) { //?id=00003

  if (data.status=='success') {
    var list = data.data.list;
    // list.reverse();

    isBusy = true;
    updateButtonStates();
    updateStatusMessage('loading '+list.length+' sketches...');

    loadSketch(list, function() {
      console.log('done');
      isBusy = false;
      updateFreeSpace();
      updateButtonStates();
    });

  } else {
    console.log('failure',data)
  }

}).fail(function(status) {
  alert("Error ("+status.status+") connecting to "+api+'list');
  console.log(status);
});

function onLogoClick() {
  location.href='/'+location.search;
}

function loadSketch(list,cb) {
  var id = list.pop();
  
  $.get(api+'?id='+id, function(data) {

    if (data.status=='success') {
      addItem(id,data.data.data);
    }

    updateStatusMessage('loading '+list.length+' sketches...');

    if (list.length>0) {
      loadSketch(list,function() {
        cb();
      })
    } else {
      cb();
    }
  });
}

function addItem(id,svgData,doPrepend) {
  var path;

// console.log($getBoundingClientRect().width);

  if (!svgData) path = "";
  else if (typeof(svgData)!='string') path = "";
  else if (svgData.indexOf("CDATA")==-1) path = "";
  else path = svgData.split('d="')[1].split('"')[0]; 

  svgWidth = svgData.split("width=\"")[1].split("\"")[0];

  var item = $('<div class="item" data="'+id+'" title="'+id+'">');
  item.attr("data-width",svgWidth);

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 640 540"><path fill="none" stroke="black" stroke-width="2" d="'+path+'"></path></svg>';
  
  item.click(function() {
    $(this).toggleClass('selected');
    console.log($(this).attr("data"));
    updateButtonStates();
  })
  item.append(svg);

  if (doPrepend) $('#svgContainer').prepend(item);
  else $('#svgContainer').append(item);
  item.hide().fadeIn();

  updateButtonStates();
}

function deleteSketches(list,cb) {
  var id = list.pop();
  
  $.post(api+'delete', {id:id}, function(data) {

    $('.item[data='+id+']').fadeOut('slow',function() {
      $(this).remove(); //remove when effect is finished
    });

    updateStatusMessage("Deleting " + list.length + ' sketches...');

    if (list.length>0) {
      deleteSketches(list,cb);
    } else {
      cb();
    }

  });
}

function deleteSelectedSketches() {
  if (confirm('Do you want to delete '+$('.item.selected').length+' drawings?')) {

    var ids = [];
    $('.item.selected').map(function(){
      ids.push($(this).attr('data'));
    });

    isBusy = true;
    updateButtonStates();

    deleteSketches(ids,function() {
      console.log('done deleting sketches');
      isBusy = false;
      updateButtonStates();
      updateFreeSpace();
    });

    deselectAll();
    updateButtonStates();
  }
}

function selectAll() {
  $('.item').addClass('selected');
  updateButtonStates();
}

function deselectAll() {
  $('.item').removeClass('selected');
  updateButtonStates();
}

function updateButtonStates() {
  var numItems = $('.item').length;
  var numSelected = $('.item.selected').length;
  var noSelection = numSelected==0;

  $("#btnDelete").attr("disabled",isBusy || noSelection);
  $("#btnDownload").attr("disabled",isBusy || noSelection);
  $("#btnDeselectAll").attr("disabled",isBusy || noSelection);
  $("#btnSelectAll").attr("disabled",isBusy || numItems==0);
  $("#btnUpload").attr("disabled",isBusy || !noSelection);
  $("#btnDelete").text("Delete" + (noSelection ? "" :  " ("+numSelected+")"));
  $("#btnDownload").text("Download" + (noSelection ? "" :  " ("+numSelected+")"));
}

function uploadFile(files, index, next) {
  var reader = new FileReader();
  reader.readAsText(files[index], "UTF-8");
  reader.onload = function (evt) {
    console.log("onload",index); //,files[index],evt.target);

    //process file
    var svg = convertSvg(evt.target.result);

    $.post(api, {data:svg}, function(data) {
      if (data.status=='success') {
        var id = data.data.id;
        addItem(id,svg,true);

        updateStatusMessage('uploading '+(files.length-index)+' sketches...');

        if (index<files.length-1) {
          uploadFile(files, index+1, next);
        } else {
          next(); //no more files, call back
        }
      }
    });

  }

  reader.onerror = function (evt) {
    console.log("onerror");
    next(); //stop processing file(s), call back/
  }
}

function upload() {
  var files = $("#uploads")[0].files
  var reader = new FileReader();
  var cur = 0;
  isBusy = true;
  updateButtonStates();
  updateStatusMessage("Uploading " + files.length + " files");

  uploadFile(files, cur, function() {
    console.log("done");
    isBusy = false;
    updateButtonStates();
    updateFreeSpace();
    $("#frmUpload")[0].reset();
  })
}

function updateFreeSpace() {
  $.get(api+'status', function(data) { //?id=00003
    if (data.status=='success') {
      var numSketches = data.data.number_of_sketches;
      var freeKb = Math.round(data.data.available/1024);
      updateStatusMessage(numSketches+" sketches, "+freeKb+"k bytes free");
    }
  });
}

function updateStatusMessage(msg) {
  $("#txtInfo").text(msg);
}

function convertSvg(svg) {
  if (!svg) return "";
  if (typeof(svg)!='string') return "";
  if (svg.indexOf("CDATA")>-1) return svg; //assume this SVG is already ok

  //this fixes SVG's created by the kunstcentraal app
  var re = /([a-zA-Z])\s?([0-9]{1,}) ([0-9]{1,})/g;
  svg = svg.replace(re,"$1$2,$3");
  re = /<\/svg>/g;
  svg = svg.replace(re,"<!--<![CDATA[d3d-keys {\"height\":5,\"outlineShape\":\"none\",\"twist\":0}]]>-->\n</svg>");

  svg = svg.replace("M0,0 ",""); //RC: hack

  return svg;
}

function download() {
  $('.item.selected').each(function() {
    var id = $(this).attr('data');
    var svgData = $(this).html();
    console.log('downloading',id);
    $('<a target="_blank" href="data:image/svg+xml,'+encodeURIComponent(svgData)+'" download="'+id+'.svg">')[0].click();
  });
}

function pointsToGCode(points) {
  var gcode = "";
  var wasMove = false;
  for (var i=0; i<points.length; i++) {
    var x = points[i][0];
    var y = points[i][1];
    var isMove = points[i][2];
    if (!wasMove && isMove) gcode += "M107       ; pump off\n";
    if (wasMove && !isMove) gcode += "M106       ; pump on\nG4 P450\n";
    gcode += "G0 X" + x + " Y" + y + "\n";
    wasMove = isMove;
  }
  return gcode;
}


//TODO: use local variables instead of _points,numLayers,VERTICALSHAPE and rStep so we can leave a current doodle in tact if an error occurs while parsing
function loadFromSvg(svgData) {
  var _points = [];
  var mode = '', x = 0, y = 0;

  console.log("loading " + svgData.length + " bytes of data...");

  // clearDoodle();

  svgData = svgData.replace("M0,0 ",""); //RC: hack

  var p = svgData.indexOf("<path");
  if (p == -1) { console.log("loadFromSvg: could not find parsing start point"); return false; }
  p = svgData.indexOf('d="', p);
  if (p == -1) { console.log("loadFromSvg: could not find parsing start point"); return false; }
  p += 3; //skip 'd="'

  var skipSpace = function() { while (svgData.charAt(p) == ' ') p++; }
  var parseCommand = function() {
    while (true) {
      skipSpace();
      var c = svgData.charAt(p);
      if (c == 'M' || c == 'm' || c == 'L' || c == 'l') { //new command letter
        mode = c;
      } else if (c == '"') { //end of command chain
        return true;
      } else { //something else, must be a pair of coordinates...
        var tx = 0, ty = 0, numberEnd = 0, len = 0;
        // var firstComma = svgData.indexOf(',', p);
        // var firstSpace = svgData.indexOf(' ', p);

        numberEnd = svgData.indexOf(',', p);

        ////// RC: if instead of a comma a space is used between a pair use that as a separator
        var firstSpace = svgData.indexOf(' ', p);
        if (firstSpace<numberEnd) numberEnd=firstSpace;   
        //console.log('numberEnd',numberEnd,firstSpace);
        ////////////////

        if (numberEnd == -1) { console.log("could not find comma in coordinate pair"); return false; }
        len = numberEnd - p;
        tx = parseFloat(svgData.substr(p, len));
        p += len + 1;
        skipSpace();
        numberEnd = svgData.indexOf(' ', p);
        if (numberEnd == -1) { console.log("could not find space after coordinate pair"); return false; }
        len = numberEnd - p;
        ty = parseFloat(svgData.substr(p, len));
        p += len;

        if (mode == 'M' || mode == 'L') {
          x = tx; y = ty;
        } else if (mode == 'm' || mode == 'l') {
          x += tx; y += ty;
        } else {
          console.log("loadFromSvg: found coordinate pair but mode was never set");
          return false;
        }

        var isMove = mode == 'm' || mode == 'M';

        //TODO: create script-wide function for adding points?
        //console.log("inserting "+x+","+y+" ",isMove);
        updatePrevX = x;
        updatePrevY = y;
        _points.push([x, y, isMove]);
        //adjustBounds(x, y);
        //adjustPreviewTransformation();

        // if (isMove) draw(x, y, -1);
        // else draw(x, y);
      }
      p++;
    }

    return true;
  };

  parseCommand(); //depends on value of p, so don't move this without taking that into consideration

  return _points;
}

getMinX = function(p) {
  var minX=9999;
  for (var i = 0; i < p.length; i++) {
    minX = Math.min(minX,p[i][0]);
  }
  return minX;
}

getMaxX = function(p) {
  var maxX=-9999;
  for (var i = 0; i < p.length; i++) {
    maxX = Math.max(maxX,p[i][0]);
  }
  return maxX;
}

getMinY = function(p) {
  var minY=9999;
  for (var i = 0; i < p.length; i++) {
    minY = Math.min(minY,p[i][1]);
  }
  return minY;
}

getMaxY = function(p) {
  var maxY=-9999;
  for (var i = 0; i < p.length; i++) {
    maxY = Math.max(maxY,p[i][1]);
  }
  return maxY;
}

alignLeft = function(p) {
  var minX = getMinX(p);
  //apply
  for (var i = 0; i < p.length; i++) {
    p[i][0] -= minX;
  }

}

alignTop = function(p) {
  var minY = getMinY(p);
  //apply
  for (var i = 0; i < p.length; i++) {
    p[i][1] -= minY;
  }
}

getWidth = function(p) {
  return getMaxX(p) - getMinX(p);
}

pointsTranslate = function(p, x, y) {
  for (var i = 0; i < p.length; i++) {
    p[i][0] += x;
    p[i][1] += y;
  }
}

pointsScale = function(p, sx, sy) {
  for (var i = 0; i < p.length; i++) {
    p[i][0] *= sx;
    p[i][1] *= sy;
  }
}

function pancake() {
  var startGcode = "W1 X42 Y210 L485 T0 ;Define Workspace of this file\nG21 ;Set units to MM\nG1 F5600 ;Set Speed\nM107 ;Pump off\nG4 P1000 ;Pause for 1000 milliseconds\nM84 ;Motors off\nG28 X0 Y0 ;Home All Axis\n";
  var endGcode = "G4 P1000\nG28 X0 Y0\nM84";
  var allGcode = startGcode;
  var offsetX = 0;

  $('.item.selected').each(function() {
    var id = $(this).attr('data');
    var svgData = $(this).html();

    var points = loadFromSvg(svgData);

    pointsScale(points,.2,-.2);
    alignLeft(points);
    alignTop(points);

    pointsTranslate(points,offsetX,0);

    offsetX += getWidth(points);

    var gcode = pointsToGCode(points);

    allGcode += gcode;

  });

  allGcode += endGcode;

  $('<a target="_blank" href="data:application/x-gcode,'+encodeURIComponent(allGcode)+'" download="doodle.gcode">')[0].click();
}
