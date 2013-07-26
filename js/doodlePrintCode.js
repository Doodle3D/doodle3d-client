var sendIndex;
var sendLength;

//var kastjeURL = "http://192.168.10.1/cgi-bin/d3dapi/";
var kastjeURL = "http://192.168.5.1/cgi-bin/d3dapi/";


var mydata = "";
function startPrint() {
  console.log("f:startPrint()");

//  sendIndex = 0;
//  sendLength = 2000; // 2000 regels
//  sendGCodeSlice(sendIndex, sendLength);

  $.post(kastjeURL + "test/" + "write/", { data: "test"}, function(data) {
    console.log("returned data: " + JSON.stringify(data));
    data = JSON.parse(data);
    console.log("    data.msg: " + data.msg);
    console.log("    data.status: " + data.status);
//    console.log("    status: " + data["status"]);
//    btnPrint.disabled = false;
  });

  //http://192.168.10.1/cgi-bin/d3dapi/write
}


function sendGCodeSlice(startIndex, sendAmt) {
  console.log("f:senGCodeSlice >> startIndex:" + startIndex + ", sendAmt:" + sendAmt);

  if (typeof startIndex == "number" && typeof sendAmt == "number") {
    var lastOne = false;
    if (data.length < (startIndex + sendAmt)) {
      console.log("f:senGCodeSlice >> not enough data left for full slice, sending smaller (and last) one");
      sendAmt = data.length - startIndex;
      lastOne = true;
    }
    var _tmp = data.slice(startIndex, startIndex+sendAmt);
    //      console.log("f:senGCodeSlice >> _tmp.length:" + _tmp.length);

    $.post("/doodle3d.of", { data:output }, function(data) {
      btnPrint.disabled = false;
    });
    sendBoy( { data: _tmp, lastOne: lastOne} , function(e) {
      console.log("sendBoy callback: " + e);
      //        console.log(e);
      //        console.log("e.success: " + e.success);
      if (e.success = true) {
        if (lastOne) {
          console.log("f:sendGCodeSlice >> DONE!");
        } else {
          sendGCodeSlice(startIndex + sendAmt, sendAmt);
        }
      }
    })
  } else {
    console.log("     something wrong");
  }
}

function sendBoy(sendObj, callback) {
  console.log("f:sendBoy() (dummy kastje) >> data length: " + sendObj.data.length + ", lastOne: " + sendObj.lastOne);
  console.log("");
  if (callback != undefined) callback({success:true});
}