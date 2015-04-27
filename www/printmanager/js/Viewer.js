var Viewer = function(viewer) {
  var className = "Viewer";
  var items = [];

  function setDoodles(_doodles) {
    doodles = _doodles;
    for (var i=0; i<doodles.length; i++) {
      var item = new ViewerItem(doodles[i]);
      items.push(item);
      var svg = item.getSvg();
      viewer.append(svg);
    }
  }

  return {
    setDoodles: setDoodles,
  }
}
