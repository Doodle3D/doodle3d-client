var api = 'http://10.0.0.40/d3dapi/sketch/';

$("#btnDelete").click(deleteSelectedSketches);
$("#btnSelectAll").click(selectAll);
$("#btnDeselectAll").click(deselectAll);
// $("#btnUpload").click(upload);
$("#uploads").change(upload);
$("#btnDownload").click(download);

$("#btnUpload").click(function() {
  console.log('trigger')
  $("#uploads").trigger('click');
});

// $("a").on("click", function () {
//     var d = new Date().toISOString().slice(0, 19).replace(/-/g, "");
//     $(this).attr("href", "data:application/octet-stream;"+encodeURIComponent("test")).attr("download", "file-" + d + ".svg");
// });


var isBusy = true;
// var statusMessage = "";

// updateFreeSpace();
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
      //updateStatusMessage('loading '+list.length+' sketches...');
      updateButtonStates();
    });

  } else {
    console.log('failure',data)
  }

});

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

  var item = $('<div class="item" data="'+id+'">');
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

    // setTimeout(function() {
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
    // },500);


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
  return svg.replace(re,"<!--<![CDATA[d3d-keys {\"height\":5,\"outlineShape\":\"none\",\"twist\":0}]]>-->\n</svg>");
}

function download() {
  $('.item.selected').each(function() {
    var id = $(this).attr('data');
    var svgData = $(this).html();
    console.log('downloading',id);
    $('<a target="_blank" href="data:image/svg+xml,'+encodeURIComponent(svgData)+'" download="'+id+'.svg">')[0].click();
  });
}

