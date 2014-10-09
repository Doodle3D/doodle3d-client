//var shapeResolution=3;
var shapePopup;

function initScanDialog() {
  scanPopup = new Popup($("#popupScan"), $("#popupMask"));
  $("#btnScanOk").on("onButtonClick", onBtnScanOk);
  $("#btnCloseScan").on("onButtonClick", onBtnCloseScan);
}

function onBtnCloseScan() {
  $('#imgGuide').hide();
  $('#btnCloseScan').hide();
}

function onBtnScanOk() {
  scanPopup.commit();
}

function showScanDialog() {
  scanPopup.open();
}

function readURL(input) {

    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
          $('#imgGuide').attr('src', e.target.result);
          $('#imgGuide').show();
          $('#btnCloseScan').show();
          scanPopup.commit();
        }

        reader.readAsDataURL(input.files[0]);
    }
}

$("#fileScan").change(function(){
    readURL(this);
});
