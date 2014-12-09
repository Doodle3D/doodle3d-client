var api = 'http://10.0.0.40/d3dapi/sketch/';

$.get(api+'list', function(data) { //?id=00003
  
  if (data.status=='success') {
    var list = data.data.list;

    loadSketch(list, function() {
      console.log('done');
    });
  }

  // numSketches = data.data.number_of_sketches;

  // loadSketch(1,function() {
  //   console.log('done');
  // });

});

function loadSketch(list,cb) {

  // console.log('loadSketch',list.length);
  var item = list.pop();
  console.log(item);

  if (list.length>0) {
    loadSketch(list,function() {
      cb();
    })
  }

  // if (num<=numSketches) {
    
  //   $.get(api+'?id='+num, function(data) {

  //     if (data.status=='success') {
  //       console.log('loaded',num)
  //       addItem(num,data.data.data);
  //     } else {
  //       console.log('failed to load',num)
  //     }

  //     loadSketch(num+1,function() {
  //       cb();
  //     });
  //   });

  //   // cb();
  // } else {
  //   cb();
  // }
  // } else {
  //   console.log('test')
  //   cb();
  // }
}

function addItem(num,svgData) {
  var path = svgData.split('d="')[1].split('"')[0];
  var item = $('<div class="item" data="'+num+'">');
  var svg = '<svg viewBox="0 0 640 540"><path fill="none" stroke="black" stroke-width="2" d="'+path+'"></path></svg>';
  
  item.click(function() {
    $(this).toggleClass('selected');
  })
  item.append(svg);

  $('#svgContainer').append(item);

  //''+num+'</div>');
}


function deleteSelectedSketches() {
  if (confirm('Do you want to delete '+$('.item.selected').length+' drawings?')) {
    $('.item.selected').each(function() {
      var id = $(this).attr('data');

      $.post(api+'delete'+id, {id:id}, function(data) {
        console.log(data);
      });
      
    })
    $('.item.selected').fadeOut();
  }
}

function deleteSketch(num) {
  
  //var selectedItems = $("input[type=checkbox]:checked");
  // console.log('deleteSketch',num)
  //confirm('Are you sure?'+selectedItems.length);
}

function selectAll() {
  $('.item').addClass('selected');
}

function deselectAll() {
  $('.item').removeClass('selected');
}


