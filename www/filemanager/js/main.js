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
$("#btnRefresh").click(refresh);
$("#btnCombine").click(combine);

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

  if (!svgData) path = "";
  else if (typeof(svgData)!='string') path = "";
  else if (svgData.indexOf("CDATA")==-1) path = "";
  else path = svgData.split('d="')[1].split('"')[0]; 

  var item = $('<li class="item ui-widget-content" data="'+id+'" title="'+id+'"></li>');
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 640 540"><path fill="none" stroke="black" stroke-width="2" d="'+path+'"></path></svg>';

  item.append(svg);
  item.click(function() {
    $(this).toggleClass('selected');
    updateButtonStates();
  })

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
  $("#btnCombine").attr("disabled",isBusy || noSelection);
  // $("#btnDelete").text("Delete" + (noSelection ? "" :  " ("+numSelected+")"));
  // $("#btnDownload").text("Download" + (noSelection ? "" :  " ("+numSelected+")"));
  // $("#btnPrint").text("Print" + (noSelection ? "..." :  " ("+numSelected+")..."));
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

function refresh() {
  location.reload();
}

function combine() {
  var ids = [];
  $('.item.selected').each(function() {
    ids.push($(this).attr('data'));
  });
  location.href = '/printmanager/?ids=' + ids.join(); //+ location.search + 
}

