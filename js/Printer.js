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
	
	Printer.UNKNOWN_STATE 			= "unknown";
	Printer.DISCONNECTED_STATE 	= "disconnected";
	Printer.IDLE_STATE 					= "idle"; 					// printer found, but idle
	Printer.BUFFERING_STATE 		= "buffering";			// printer is buffering (recieving) data, but not yet printing
	Printer.PRINTING_STATE 			= "printing";
	Printer.STOPPING_STATE 			= "stopping";				// when you stop (abort) a print it prints the endcode

	this.temperature 				= 0;
	this.targetTemperature 	= 0;
	this.currentLine 				= 0;
	this.totalLines					= 0;
	this.bufferedLines			= 0;
	this.state							= Printer.UNKNOWN_STATE;
	this.hasControl					= true;	// whether this client has control access 
	
	this.wifiboxURL; 
	
	this.checkStatusInterval 				= 3000;
	this.checkStatusDelay;
	this.timeoutTime 								= 3000;
	this.sendPrintPartTimeoutTime 	= 5000;
	
	this.gcode; 											// gcode to be printed
	this.sendLength = 1500; 					// max amount of gcode lines per post (limited because WiFi box can't handle to much)

	this.retryDelay = 2000; 					// retry setTimout delay
	this.retrySendPrintPartDelay; 		// retry setTimout instance
	this.retryCheckStatusDelay; 			// retry setTimout instance
	this.retryStopDelay;							// retry setTimout instance
	this.retryPreheatDelay;						// retry setTimout instance
	
	this.maxGCodeSize = 10;						// max size of gcode in MB's (estimation)
	
	this.stateOverruled = false;
	
	// Events
	Printer.UPDATE = "update";
	
	var self = this;
	
	this.init = function() {
    console.log("Printer:init");
		//this.wifiboxURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
		//this.wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";
		this.wifiboxURL = wifiboxURL;
		//this.wifiboxURL = "proxy5.php";
    console.log("  wifiboxURL: ",this.wifiboxURL);
    
    if(autoUpdate) {
	    this.checkStatus();
    }
 	}
	
	this.preheat = function() {
    console.log("Printer:preheat");
    var self = this;
    if (communicateWithWifibox) {
	    $.ajax({
			  url: this.wifiboxURL + "/printer/heatup",
			  type: "POST",
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
    
    //this.targetTemperature = settings["printer.temperature"]; // slight hack
    
		this.sendPrintPart(this.sendIndex, this.sendLength);
	}
	this.byteSize = function(s){
		return~-encodeURI(s).split(/%..|./).length;
	}
	this.sendPrintPart = function(sendIndex,sendLength) {
		console.log("Printer:sendPrintPart sendIndex: " + sendIndex + "/" + this.gcode.length + ", sendLength: " + sendLength);
		
    var firstOne = (sendIndex == 0)? true : false;
    var start = firstOne; // start printing right away
    
    var completed = false;
    if (this.gcode.length < (sendIndex + sendLength)) {
      console.log("  sending less than max sendLength (and last)");
      sendLength = this.gcode.length - sendIndex;
      //lastOne = true;
      completed = true;
    }
    var gcodePart = this.gcode.slice(sendIndex, sendIndex+sendLength);
    
    var postData = { gcode: gcodePart.join("\n"), first: firstOne, start: start};
    var self = this;
    if (communicateWithWifibox) {
	    $.ajax({
			  url: this.wifiboxURL + "/printer/print",
			  type: "POST",
			  data: postData,
			  dataType: 'json',
			  timeout: this.sendPrintPartTimeoutTime,
			  success: function(data){
			  	console.log("Printer:sendPrintPart response: ",data);
			  	
			  	if(data.status == "success") {
				  	if (completed) {
		          console.log("Printer:sendPrintPart:gcode sending completed");
		          this.gcode = [];
		          btnStop.css("display","block");
		          //self.targetTemperature = settings["printer.temperature"]; // slight hack
		        } else {
		        	// only if the state hasn't bin changed (by for example pressing stop) we send more gcode
		        	
		        	console.log("Printer:sendPrintPart:gcode part received (state: ",self.state,")"); 
		        	if(self.state == Printer.PRINTING_STATE || self.state == Printer.BUFFERING_STATE) {
		        		console.log("Printer:sendPrintPart:sending next part");
		        		self.sendPrintPart(sendIndex + sendLength, sendLength);
		        	}
		        }
		      }
				}
			}).fail(function() { 
				console.log("Printer:sendPrintPart: failed");
				clearTimeout(self.retrySendPrintPartDelay);
				self.retrySendPrintPartDelay = setTimeout(function() {
					console.log("request printer:sendPrintPart failed retry");
					self.sendPrintPart(sendIndex, sendLength) 
				},self.retryDelay); // retry after delay
			});
		} else {
      console.log ("Printer >> f:sendPrintPart() >> communicateWithWifibox is false, so not executing this function");
    }
	}
	
	this.stop = function() {
    console.log("Printer:stop");
		var self = this;
		if (communicateWithWifibox) {
	    $.ajax({
			  url: this.wifiboxURL + "/printer/stop",
			  type: "POST",
			  dataType: 'json',
			  timeout: this.timeoutTime,
			  success: function(data){
				  console.log("Printer:stop response: ", data);
			  }
			}).fail(function() { 
				console.log("Printer:stop: failed");
				clearTimeout(self.retryStopDelay);
				self.retryStopDelay = setTimeout(function() { self.stop() },self.retryDelay); // retry after delay
			});
		} else {
      console.log ("Printer >> f:communicateWithWifibox() >> communicateWithWifibox is false, so not executing this function");
    }
	}
	
	this.checkStatus = function() {
		console.log("Printer:checkStatus");
		this.stateOverruled = false;
		console.log("  stateOverruled: ",this.stateOverruled);
    var self = this;
    if (communicateWithWifibox) {
      $.ajax({
        url: this.wifiboxURL + "/info/status",
        dataType: 'json',
        timeout: this.timeoutTime,
        success: function(response){
          console.log("  Printer:status: ",response.data.state); //," response: ",response);
          
          self.handleStatusUpdate(response);
          
          clearTimeout(self.checkStatusDelay);
          clearTimeout(self.retryCheckStatusDelay);
          self.checkStatusDelay = setTimeout(function() { self.checkStatus() }, self.checkStatusInterval);
        }
      }).fail(function() {
          console.log("Printer:checkStatus: failed");
          self.state = Printer.UNKNOWN_STATE;
          clearTimeout(self.checkStatusDelay);
          clearTimeout(self.retryCheckStatusDelay);
          self.retryCheckStatusDelay = setTimeout(function() { self.checkStatus() },self.retryDelay); // retry after delay
        });
    } else {
      console.log ("Printer >> f:checkStatus() >> communicateWithWifibox is false, so not executing this function");
    }
	}
	this.handleStatusUpdate = function(response) {
		console.log("Printer:handleStatusUpdate");
		var data = response.data;
		if(response.status != "success") {
			self.state = Printer.UNKNOWN_STATE;
		} else {
			// state
			console.log("  stateOverruled: ",this.stateOverruled);
			if(!this.stateOverruled) {
				self.state 								= data.state;
				console.log("  state > ",self.state);
			}
			
			// temperature
			self.temperature 					= data.hotend;
			self.targetTemperature 		= data.hotend_target;
			
			// progress
			self.currentLine 					= data.current_line;
			self.totalLines 					= data.total_lines;
			self.bufferedLines				= data.buffered_lines

			// access
			self.hasControl						= data.has_control;
			
			if(self.state == Printer.PRINTING_STATE || self.state == Printer.STOPPING_STATE) {
				console.log("progress: ",self.currentLine+"/"+self.totalLines+" ("+self.bufferedLines+") ("+self.state+")");
			}
		}
		$(document).trigger(Printer.UPDATE);
	}
	this.overruleState = function(newState) {
		this.stateOverruled = true;
		console.log("  stateOverruled: ",this.stateOverruled);
		
		self.state = newState;
		
		$(document).trigger(Printer.UPDATE);
		
		this.resetStatusCheckInterval();
	}
	this.resetStatusCheckInterval = function() {
		console.log("resetStatusCheckInterval");
		clearTimeout(self.checkStatusDelay);
		clearTimeout(self.retryCheckStatusDelay);
		self.checkStatusDelay = setTimeout(function() { self.checkStatus() }, self.checkStatusInterval);
	}
}