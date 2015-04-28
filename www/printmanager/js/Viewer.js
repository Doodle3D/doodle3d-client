var Viewer = function(_viewer) {
  var className = "Viewer";
  var viewer = _viewer;
  var items = [];
  var colors = ['#FF00BF','#FFBF00','#00FFFF','#0040FF','#00FF40','#7F00FF','#FF0000','#80FF00','#FF00BF','#FF0000'];

  function setDoodles(doodles) {
    for (var i=0; i<doodles.length; i++) {
      var item = new ViewerItem(doodles[i]);
      items.push(item);
      var svg = item.getSvg();
      viewer.append(svg);
      item.setColor(colors[i % doodles.length]);
    }
  }

  function clear() {
    viewer.empty();
    items.length = 0;
  }

  return {
    setDoodles: setDoodles,
    clear: clear,
  }
}
