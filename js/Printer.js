/* not using this now
var $printProgressContainer = $("#printProgressContainer");
var $progressbar = $("#progressbar");
var $progressAmount = $(".progressAmount");
function setPrintprogress(val) {
  if (isNaN(val)) return;
//  console.log("f:setPrintprogress() >> val " + val);
  $progressbar.css("width", val*100 + "%");
  $progressAmount.text(Math.floor(val*100) + "%");
}
//*/

function Printer() {
	this.temperature = 0;
	this.targetTemperature = 0;
	this.printing;
	
	this.wifiboxURL; 
	
	this.maxTempLastMod = 5; // max time (seconds) since the last temp info modification before the printer connection is considered lost
		
	this.checkTemperatureInterval = 6000;
	this.checkTemperatureDelay;
	this.checkProgressInterval = 6000;
	this.checkProgressDelay;
	this.timeoutTime = 3000;
	
	this.gcode; 											// gcode to be printed
	this.sendLength = 6000; 					// max amount of gcode lines per post (limited because WiFi box can't handle to much)

	this.retryDelay = 2000; 					// retry setTimout delay
	this.retrySendPrintPartDelay; 		// retry setTimout instance
	this.retryCheckTemperatureDelay; 	// retry setTimout instance
	this.retryCheckProgressDelay; 		// retry setTimout instance
	this.retryStopDelay;							// retry setTimout instance
	this.retryPreheatDelay;						// retry setTimout instance

	this.maxGCodeSize = 10;						// max size of gcode in MB's (estimation)
	
	this.sendStopGCodeDelay = 1000;
	
	// Events
	Printer.UPDATE = "update";
	
	this.init = function() {
    console.log("Printer:init");
		//this.wifiboxURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
		//this.wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";
		this.wifiboxURL = wifiboxURL;
		//this.wifiboxURL = "proxy5.php";
    console.log("  wifiboxURL: ",this.wifiboxURL);
    
    if(autoUpdate) {
	    this.checkTemperature();
	    this.checkProgress();
    }
 	}
	
	this.preheat = function() {
    console.log("Printer:preheat");
		var postData = { id: 0 };
    var self = this;
    if (communicateWithWifibox) {
	    $.ajax({
			  url: this.wifiboxURL + "/printer/heatup",
			  type: "POST",
			  data: postData,
			  dataType: 'json',
			  timeout: this.timeoutTime,
			  success: function(data){
			  	console.log("Printer:preheat response: ",data);
			  	if(data.status == "error") {
			  		clearTimeout(self.retryPreheatDelay);
						self.retryPreheatDelay = setTimeout(function() { self.preheat() },self.retryDelay); // retry after delay
			  	}
				}
			}).fail(function() { 
				console.log("Printer:preheat: failed");
				clearTimeout(self.retryPreheatDelay);
				self.retryPreheatDelay = setTimeout(function() { self.preheat() },self.retryDelay); // retry after delay
			});
		} else {
      console.log ("Printer >> f:preheat() >> communicateWithWifibox is false, so not executing this function");
    }
	}
	
	this.print = function(gcode) {
    console.log("Printer:print");
    console.log("  gcode total # of lines: " + gcode.length);
    
    /*for (i = 0; i < gcode.length; i++) {
			gcode[i] += " (" + i + ")";
		}*/
		
		this.sendIndex = 0;
    this.gcode = gcode;
    
    //console.log("  gcode[20]: ",gcode[20]);
    var gcodeLineSize = this.byteSize(gcode[20]);
    //console.log("  gcodeLineSize: ",gcodeLineSize);
    var gcodeSize = gcodeLineSize*gcode.length/1024/1024; // estimate gcode size in MB's
    console.log("  gcodeSize: ",gcodeSize);
    
    if(gcodeSize > this.maxGCodeSize) {
    	console.log("Error: Printer:print: gcode file is probably to big ("+gcodeSize+"MB) (max: "+this.maxGCodeSize+"MB)");
    	return;
    }
    
    this.targetTemperature = settings["printer.temperature"]; // slight hack
    
		this.sendPrintPart(this.sendIndex, this.sendLength);
		
		this.restartIntervals(); // slight hack
	}
	this.byteSize = function(s){
		return~-encodeURI(s).split(/%..|./).length;
	}
	this.sendPrintPart = function(sendIndex,sendLength) {
		console.log("Printer:sendPrintPart sendIndex: " + sendIndex + "/" + this.gcode.length + ", sendLength: " + sendLength);
		
    var firstOne = (sendIndex == 0)? true : false;
		var lastOne = false;
    if (this.gcode.length < (sendIndex + sendLength)) {
      console.log("  sending less than max sendLength (and last)");
      sendLength = this.gcode.length - sendIndex;
      lastOne = true;
    }
    var gcodePart = this.gcode.slice(sendIndex, sendIndex+sendLength);
    
    var postData = { id: 0, gcode: gcodePart.join("\n"), first: firstOne, last: lastOne};
    var self = this;
    if (communicateWithWifibox) {
	    $.ajax({
			  url: this.wifiboxURL + "/printer/print",
			  type: "POST",
			  data: postData,
			  dataType: 'json',
			  timeout: this.timeoutTime,
			  success: function(data){
			  	console.log("Printer:sendPrintPart response: ",data);
			  	
			  	if(data.status == "success") {
				  	if (lastOne) {
		          console.log("Printer:sendPrintPart:gcode sending completed");
		          this.gcode = [];
		          self.targetTemperature = settings["printer.temperature"]; // slight hack
		        } else {
		          self.sendPrintPart(sendIndex + sendLength, sendLength);
		        }
		      }
				}
			}).fail(function() { 
				console.log("Printer:sendPrintPart: failed");
				clearTimeout(self.retrySendPrintPartDelay);
				self.retrySendPrintPartDelay = setTimeout(function() { self.sendPrintPart(sendIndex, sendLength) },self.retryDelay); // retry after delay
			});
		} else {
      console.log ("Printer >> f:sendPrintPart() >> communicateWithWifibox is false, so not executing this function");
    }
	}
	
	this.stop = function() {
    console.log("Printer:stop");
		var postData = { id: 0 }; 
		var self = this;
		if (communicateWithWifibox) {
	    $.ajax({
			  url: this.wifiboxURL + "/printer/stop",
			  type: "POST",
			  data: postData,
			  dataType: 'json',
			  timeout: this.timeoutTime,
			  success: function(data){
				  console.log("Printer:stop response: ", data);
				  
				  setTimeout(function() { console.log("send: ",gcodeEnd); self.print(gcodeEnd) },self.sendStopGCodeDelay);
			  }
			}).fail(function() { 
				console.log("Printer:stop: failed");
				clearTimeout(self.retryStopDelay);
				self.retryStopDelay = setTimeout(function() { self.stop() },self.retryDelay); // retry after delay
			});
		} else {
      console.log ("Printer >> f:communicateWithWifibox() >> communicateWithWifibox is false, so not executing this function");
    }
		
		this.restartIntervals(); // slight hack
	}
	
	this.checkTemperature = function() {
		//console.log("Printer:checkTemperature");
    var getData = { id: 0 };
    var self = this;
    if (communicateWithWifibox) {
      $.ajax({
        url: this.wifiboxURL + "/printer/temperature",
        data: getData,
        dataType: 'json',
        timeout: this.timeoutTime,
        success: function(data){
          //console.log("Printer:temperature response: ",data);
          if(data.status == "success") {
            //console.log("temp: ",response.data.hotend+"/"+response.data.hotend_target+" ("+response.data.last_mod+")");
            self.temperature = data.data.hotend;
            if(data.data.hotend_target != undefined) {
            	if(self.@@@@)
              self.targetTemperature = data.data.hotend_target;
              
              self.targetTemperature = settings["printer.temperature"]; // hack
            }
            self.alive = (data.data.last_mod < self.maxTempLastMod);
          } else {
            self.alive = false;
          }
          //console.log("  this.alive: ",self.alive);
          $(document).trigger(Printer.UPDATE);

          self.checkTemperatureDelay = setTimeout(function() { self.checkTemperature() }, self.checkTemperatureInterval);
        }
      }).fail(function() {
          console.log("Printer:checkTemperature: failed");
          clearTimeout(self.retryCheckTemperatureDelay);
          self.retryCheckTemperatureDelay = setTimeout(function() { self.checkTemperature() },self.retryDelay); // retry after delay
        });
    } else {
      console.log ("Printer >> f:checkTemperature() >> communicateWithWifibox is false, so not executing this function");
    }
	}
	this.checkProgress = function() {
		//console.log("Printer:checkProgress");
    var getData = { id: 0 };
		var self = this;
    if (communicateWithWifibox) {
      $.ajax({
        url: this.wifiboxURL + "/printer/progress",
        data: getData,
        dataType: 'json',
        timeout: this.timeoutTime,
        success: function(data){
          if(data.status == "success") {

            self.printing = data.data.printing;
            self.currentLine = data.data.current_line;
            self.num_lines = data.data.num_lines;

            if(self.printing) {
              console.log("progress: ",data.data.current_line+"/"+data.data.num_lines+" ("+data.data.last_mod+")");
            }
          } else {
          	self.printing = false;
          }
          //console.log("  this.alive: ",self.alive);
          $(document).trigger(Printer.UPDATE);

          self.checkProgressDelay = setTimeout(function() { self.checkProgress() },self.checkProgressInterval);
        }
      }).fail(function() {
          console.log("Printer:checkProgress: failed");
          clearTimeout(self.retryCheckProgressDelay);
          self.retryCheckProgressDelay = setTimeout(function() { self.checkProgress() },self.retryDelay); // retry after delay
        });
    } else {
      console.log ("Printer >> f:checkProgress() >> communicateWithWifibox is false, so not executing this function");
    }
	}

	this.restartIntervals = function() {
		var self = this;
		clearTimeout(self.checkProgressDelay);
		self.checkProgressDelay = setTimeout(function() { self.checkProgress() },self.checkProgressInterval);
		
		clearTimeout(self.checkTemperatureDelay);
		self.checkTemperatureDelay = setTimeout(function() { self.checkTemperature() }, self.checkTemperatureInterval);
	}
}