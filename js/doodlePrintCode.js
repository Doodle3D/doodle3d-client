var sendIndex;
var sendLength;

var data = "";
function startPrint(gcode) {
	console.log("f:startPrint()");
	console.log("total # of lines: " + gcode.length);
	data = gcode;

	sendIndex = 0;
	sendLength = 2000; // 2000 regels
	sendGCodeSlice(sendIndex, sendLength);
}


function sendGCodeSlice(startIndex, sendAmt) {
  console.log("f:sendGCodeSlice >> startIndex:" + startIndex + ", sendAmt:" + sendAmt);

  if (typeof startIndex == "number" && typeof sendAmt == "number") {
    var lastOne = false;
    if (data.length < (startIndex + sendAmt)) {
      console.log("f:senGCodeSlice >> not enough data left for full slice, sending smaller (and last) one");
      sendAmt = data.length - startIndex;
      lastOne = true;
    }
    var _tmp = data.slice(startIndex, startIndex+sendAmt);
    //      console.log("f:senGCodeSlice >> _tmp.length:" + _tmp.length);

//    $.post("/doodle3d.of", { data:data }, function(data) {
//      btnPrint.disabled = false;
//    });
    
    var firstOne = false;
    if (startIndex == 0) { firstOne = true; }
    
    var postData = { id: 0, gcode: _tmp.join("\n"), first: firstOne, last: lastOne};
    
    $.post( wifiboxURL + "/printer/print", postData , function(e) {
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
  console.log("f:sendBoy() (dummy kastje) >> data length: " + sendObj.data.length + ", lastOne: " + sendObj.last);
  console.log("");
  if (callback != undefined) callback({success:true});
}