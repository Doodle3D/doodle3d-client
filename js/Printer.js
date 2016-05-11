/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

/* not using this now
var $printProgressContainer = $("#printProgressContainer");
var $progressbar = $("#progressbar");
var $progressAmount = $(".progressAmount");
function setPrintprogress(val) {
	if (isNaN(val)) return;
//	console.log("f:setPrintprogress() >> val " + val);
	$progressbar.css("width", val*100 + "%");
	$progressAmount.text(Math.floor(val*100) + "%");
}
//*/

function Printer() {
  /* CONSTANTS */

	Printer.WIFIBOX_DISCONNECTED_STATE	= "wifibox disconnected";
	Printer.UNKNOWN_STATE				= "unknown";				// happens when a printer is connection but there isn't communication yet
	Printer.DISCONNECTED_STATE			= "disconnected";			// printer disconnected
	Printer.CONNECTING_STATE 			= "connecting";				// printer connecting (printer found, but driver has not yet finished setting up the connection)
	Printer.IDLE_STATE 					= "idle"; 					// printer found and ready to use, but idle
	Printer.BUFFERING_STATE				= "buffering";				// printer is buffering (recieving) data, but not yet printing
	Printer.PRINTING_STATE				= "printing";
	Printer.STOPPING_STATE				= "stopping";				// when you stop (abort) a print it prints the endcode
	Printer.TOUR_STATE					= "tour";					// when in joyride mode

	Printer.ON_BEFORE_UNLOAD_MESSAGE = "You're doodle is still being sent to the printer, leaving will result in a incomplete 3D print";

  //after buffer full message has been received, wait until the buffer load is below this ratio before sending new data
  Printer.GCODE_BUFFER_WAIT_LOAD_RATIO = 0.75;
  Printer.BUFFER_SPACE_WAIT_TIMEOUT = 30000; // how often to recheck buffer load
  
  //time to wait when wifibox connection is lost while printing
  Printer.DISCONNECTED_RETRY_DELAY = 5000;
  
  Printer.MAX_LINES_PER_POST = 500; // max amount of gcode lines per post (limited because WiFi box can't handle too much)
  Printer.MAX_GCODE_SIZE = 10; // max size of gcode in MB's (estimation)

  // Events
  Printer.UPDATE = "update";

  
  /* MEMBER VARIABLES */

	this.temperature 		= 0;
	this.targetTemperature 	= 0;
	this.currentLine 		= 0;
	this.totalLines			= 0;
	this.bufferedLines		= 0;
	this.bufferSize = 0;
	this.maxBufferSize = 0;
	this.state				= Printer.UNKNOWN_STATE;
	this.hasControl			= true;	// whether this client has control access

	this.wifiboxURL;

	this.checkStatusInterval = 3000;
	this.checkStatusDelay;
	this.timeoutTime = 3000;
	this.sendPrintPartTimeoutTime = 5000;

	this.gcode = []; // gcode to be printed
	this.gcodeNumChunks = 0; //number of chunks to be sent (used for sequence numbering)

	this.retryDelay = 2000; 				// retry setTimout delay
	this.retrySendPrintPartDelay; 			// retry setTimout instance
	this.retryCheckStatusDelay; 			// retry setTimout instance
	this.retryStopDelay;					// retry setTimout instance
	this.retryPreheatDelay;					// retry setTimout instance

	this.stateOverruled = false;

	
	/* FUNCTIONS */

	var self = this;

	this.init = function() {
		//console.log("Printer:init");
		//this.wifiboxURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
		//this.wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";
		this.wifiboxURL = wifiboxURL;
		//this.wifiboxURL = "proxy5.php";
		//console.log("  wifiboxURL: ",this.wifiboxURL);

		if (autoUpdate) {
			this.startStatusCheckInterval();
		}
	}

	this.preheat = function() {
		console.log("Printer:preheat");

		if (this.state != Printer.IDLE_STATE) return;

		var self = this;
		if (communicateWithWifibox) {
			$.ajax({
				url: this.wifiboxURL + "/printer/heatup",
				type: "POST",
				dataType: 'json',
				timeout: this.timeoutTime,
				success: function(data){
					console.log("Printer:preheat response: ",data);
					if(data.status != "success") {
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

		message.set("Sending doodle to printer...",Message.NOTICE);
		self.addLeaveWarning();

		/*for (i = 0; i < gcode.length; i++) {
			gcode[i] += " (" + i + ")";
		}*/

		this.sendIndex = 0;
		this.gcode = gcode;
		this.gcodeNumChunks = Math.ceil(this.gcode.length / Printer.MAX_LINES_PER_POST);

		//console.log("  gcode[20]: ",gcode[20]);
		var gcodeLineSize = this.byteSize(gcode[20]);
		//console.log("  gcodeLineSize: ",gcodeLineSize);
		var gcodeSize = gcodeLineSize*gcode.length/1024/1024; // estimate gcode size in MB's
		console.log("  gcodeSize: ",gcodeSize);

		if(gcodeSize > Printer.MAX_GCODE_SIZE) {
			var msg = "Error: Printer:print: gcode file is probably too big ("+gcodeSize+"MB) (max: "+Printer.MAX_GCODE_SIZE+"MB)";
			alert(msg);
			console.log(msg);

			this.overruleState(Printer.IDLE_STATE);
			this.startStatusCheckInterval();
			message.hide();
			self.removeLeaveWarning();

			return;
		}

		//this.targetTemperature = settings["printer.temperature"]; // slight hack

		this.sendPrintPart(this.sendIndex, Printer.MAX_LINES_PER_POST);
	}

	this.byteSize = function(s){
		return~-encodeURI(s).split(/%..|./).length;
	}

	this.sendPrintPart = function(sendIndex,sendLength) {
		var self = this;
		// Abort if stopping
		// sendPrintPart can be called by delayed retry after request timeout for example
		if (self.state === Printer.STOPPING_STATE) return;

		var completed = false;
		if (this.gcode.length < (sendIndex + sendLength)) {
			sendLength = this.gcode.length - sendIndex;
			completed = true;
		}


		/* prepare post data */

		var gcodePart = this.gcode.slice(sendIndex, sendIndex + sendLength);
		var firstOne = (sendIndex == 0) ? true : false;
		var start = firstOne; // start printing right away
		var seqNum = Math.floor(sendIndex / Printer.MAX_LINES_PER_POST);
		var postData = {
				gcode: gcodePart.join("\n"), total_lines: this.gcode.length,
				clear: firstOne, start: start,
				seq_number: seqNum, seq_total: this.gcodeNumChunks
		};

		
		/* inform user what's going on */

		var lessThanMaxText = completed ? " (last one, max=" + Printer.MAX_LINES_PER_POST + ")" : "";
		console.log("Printer:sendPrintPart: sendIndex=" + sendIndex + "/" + this.gcode.length +
				", sendLength=" + sendLength + lessThanMaxText +
				", sequence numbers: " + seqNum + "/" + this.gcodeNumChunks);

		var sendPercentage = Math.round(sendIndex / this.gcode.length * 100);
		message.set("Sending doodle to printer: " + sendPercentage + "%", Message.NOTICE, false, true);

		
		/* send data */
		if (communicateWithWifibox) {
			$.ajax({
				url: this.wifiboxURL + "/printer/print",
				type: "POST",
				data: postData,
				dataType: 'json',
				timeout: this.sendPrintPartTimeoutTime,
				success: function(data){
					//console.log("Printer:sendPrintPart success response: ", data);

					if(data.status == "success") {
						if (completed) {
							console.log("Printer:sendPrintPart: gcode sending completed");
							this.gcode = [];
							this.gcodeNumChunks = 0;
							self.removeLeaveWarning();
							message.set("Doodle has been sent to printer...",Message.INFO,true);
							//self.targetTemperature = settings["printer.temperature"]; // slight hack
						} else {
							// only if the state hasn't been changed (by for example pressing stop) we send more gcode

							//console.log("Printer:sendPrintPart:gcode part received (state: ",self.state,")");
							if(self.state == Printer.PRINTING_STATE || self.state == Printer.BUFFERING_STATE) {
								//console.log("Printer:sendPrintPart:sending next part");
								self.sendPrintPart(sendIndex + sendLength, sendLength);
							} else if (Printer.WIFIBOX_DISCONNECTED_STATE) {
								console.warn("Printer:sendPrintPart: wifibox connection lost while printing, retrying in " + (Printer.DISCONNECTED_RETRY_DELAY / 1000) + " seconds");
								clearTimeout(self.retrySendPrintPartDelay);
								self.retrySendPrintPartDelay = setTimeout(function() {
									console.log("Printer:sendPrintPart: retrying after wifibox disconnect was detected");
									self.sendPrintPart(sendIndex, sendLength);
								}, Printer.DISCONNECTED_RETRY_DELAY);
							}
						}
					} else if (data.status == "fail") {
					  if (data.data.status == "buffer_full") {
					  	console.log("Printer:sendPrintPart: print server reported buffer full, pausing data transmission");
					    //this will wait in a setTimeout loop until enough room is available and then call sendPrintPart again.
					    self.waitForBufferSpace(sendIndex, sendLength);
					  } else if (data.data.status == "seq_num_mismatch" && data.data.seq_number == seqNum) {
				  		console.warn("Printer:sendPrintPart: received sequence error, server is one chunk ahead. Proceeding with next chunk...");
				  		self.sendPrintPart(sendIndex + sendLength, sendLength);
					  } else {
					    console.error("Printer:sendPrintPart: unexpected failure response for API endpoint printer/print (" +
					    		data.data.status + ", current server seq. info: " + data.data.seq_number + "/" + data.data.seq_total + ")");
					    //sequence errors should not occur, except perhaps when 'stop' was clicked while still sending (https://github.com/Doodle3D/doodle3d-client/issues/226).
					    if (self.state != Printer.STOPPING_STATE) {
					    	message.set("Unexpected error sending doodle to printer (" + data.data.status + "), please retry", Message.ERROR, false, true);
					    }
					  }
					}

					// after we know the first gcode part has been received or failed
					// (and the driver had time to update the printer.state)
					// we start checking the status again
					if(sendIndex == 0) {
						self.startStatusCheckInterval();
					}
				}
			}).fail(function(jqXHr, textStatus, errorThrown) {
				console.error("Printer:sendPrintPart: failed (AJAX status: '" + textStatus + "') AJAX exception (if any):", errorThrown);
				console.warn("Printer:sendPrintPart: retrying in " + (Printer.DISCONNECTED_RETRY_DELAY / 1000) + " seconds");
				clearTimeout(self.retrySendPrintPartDelay);
				self.retrySendPrintPartDelay = setTimeout(function() {
					console.log("Printer:sendPrintPart: retrying after AJAX failure");
					self.sendPrintPart(sendIndex, sendLength)
				}, Printer.DISCONNECTED_RETRY_DELAY);

				// after we know the gcode packed has bin received or failed
				// (and the driver had time to update the printer.state)
				// we start checking the status again
				self.startStatusCheckInterval();
			});
		} else {
			console.log ("Printer >> f:sendPrintPart() >> communicateWithWifibox is false, so not executing this function");
		}
	}
	
	/*
	 * Called by sendPrintPart when a buffer_full fail response is received.
	 * This function keeps calling itself until the GCodeBuffer's load ratio
	 * drops below a predefined value and then calls sendPrintPart again.
	 */
	this.waitForBufferSpace = function(sendIndex,sendLength) {
    var fillRatio = this.bufferSize / this.maxBufferSize;
    var self = this;

    //console.log("buffer fill state: " + self.bufferSize + "/" + self.maxBufferSize + " (" + fillPercent + "%)");

    if (fillRatio >= Printer.GCODE_BUFFER_WAIT_LOAD_RATIO) {
      var fillPercent = (fillRatio * 100).toFixed(2);
      console.log("Printer:waitForBufferSpace: waiting until gcode buffer load ratio is below " +
          (Printer.GCODE_BUFFER_WAIT_LOAD_RATIO * 100) + "% (current: " + fillPercent + "% of " +
          (self.maxBufferSize / 1024) + "KiB)");
      self.waitForBufferSpaceDelay = setTimeout(function() { self.waitForBufferSpace(sendIndex, sendLength); }, Printer.BUFFER_SPACE_WAIT_TIMEOUT);
    } else {
      if(self.state == Printer.PRINTING_STATE || self.state == Printer.BUFFERING_STATE) {
        console.log("Printer:waitForBufferSpace: load ratio dropped below " + (Printer.GCODE_BUFFER_WAIT_LOAD_RATIO * 100) + "%, calling sendPrintPart...");
        self.sendPrintPart(sendIndex, sendLength);
      } else {
        console.log("Printer:waitForBufferSpace: load ratio dropped far enough but printer state is not printing or buffering anymore, not resuming.");
      }
    }
	}

	this.stop = function() {
		console.log("Printer:stop");
		var self = this;
		if (self.retrySendPrintPartDelay !== undefined) {
			clearTimeout(self.retrySendPrintPartDelay);
		}
		if (self.waitForBufferSpaceDelay !== undefined) {
			clearTimeout(self.waitForBufferSpaceDelay);
		}

		endCode = generateEndCode();
		console.log("  endCode: ",endCode);
		var postData = { gcode: endCode.join("\n")};
		if (communicateWithWifibox) {
			$.ajax({
				url: this.wifiboxURL + "/printer/stop",
				type: "POST",
				data: postData,
				dataType: 'json',
				timeout: this.timeoutTime,
				success: function(data){
					console.log("Printer:stop response: ", data);

					// after we know the stop has bin received or failed
					// (and the driver had time to update the printer.state)
					// we start checking the status again
					self.startStatusCheckInterval();
				}
			}).fail(function() {
				console.log("Printer:stop: failed");
				clearTimeout(self.retryStopDelay);
				self.retryStopDelay = setTimeout(function() { self.stop() },self.retryDelay); // retry after delay

				// after we know the stop has bin received or failed
				// (and the driver had time to update the printer.state)
				// we start checking the status again
				self.startStatusCheckInterval();
			});
		} else {
			console.log ("Printer >> f:stop() >> communicateWithWifibox is false, so not executing this function");
		}
	}

	this.startStatusCheckInterval = function() {
		console.log("Printer:startStatusCheckInterval");
		self.checkStatus();
		clearTimeout(self.checkStatusDelay);
		clearTimeout(self.retryCheckStatusDelay);
		self.checkStatusDelay = setTimeout(function() { self.checkStatus() }, self.checkStatusInterval);
	}

	this.stopStatusCheckInterval = function() {
		console.log("Printer:stopStatusCheckInterval");
		clearTimeout(self.checkStatusDelay);
		clearTimeout(self.retryCheckStatusDelay);
	}

	this.checkStatus = function() {
		//console.log("Printer:checkStatus");
		this.stateOverruled = false;
		//console.log("  stateOverruled: ",this.stateOverruled);
		var self = this;
		if (communicateWithWifibox) {
			$.ajax({
				url: this.wifiboxURL + "/info/status",
				dataType: 'json',
				timeout: this.timeoutTime,
				success: function(response){
					//console.log("  Printer:status: ",response.data.state); //," response: ",response);

					self.handleStatusUpdate(response);

					clearTimeout(self.checkStatusDelay);
					clearTimeout(self.retryCheckStatusDelay);
					self.checkStatusDelay = setTimeout(function() { self.checkStatus() }, self.checkStatusInterval);
				}
			}).fail(function() {
				console.log("Printer:checkStatus: failed");
				self.state = Printer.WIFIBOX_DISCONNECTED_STATE;
				clearTimeout(self.checkStatusDelay);
				clearTimeout(self.retryCheckStatusDelay);
				self.retryCheckStatusDelay = setTimeout(function() { self.checkStatus() },self.retryDelay); // retry after delay
				$(document).trigger(Printer.UPDATE);
			});
		} else {
			console.log ("Printer >> f:checkStatus() >> communicateWithWifibox is false, so not executing this function");
		}
	}

	this.handleStatusUpdate = function(response) {
		//console.log("Printer:handleStatusUpdate response: ",response);
		var data = response.data;
		if(response.status != "success") {
			self.state = Printer.UNKNOWN_STATE;
		} else {
			// state
			//console.log("  stateOverruled: ",this.stateOverruled);
			if(!this.stateOverruled) {
				self.state = data.state;
				//console.log("  state > ",self.state);
			}

			// temperature
			self.temperature = data.hotend;
			self.targetTemperature = data.hotend_target;

			// progress
			self.currentLine = data.current_line;
			self.totalLines = data.total_lines;
			self.bufferedLines = data.buffered_lines;
			self.bufferSize = data.buffer_size;
			self.maxBufferSize = data.max_buffer_size;

			// access
			self.hasControl = data.has_control;

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

		this.stopStatusCheckInterval();
	}

	this.removeLeaveWarning = function() {
		window.onbeforeunload = null;
	}

	this.addLeaveWarning = function() {
		window.onbeforeunload = function() {
			console.log("WARNING:"+Printer.ON_BEFORE_UNLOAD_MESSAGE);
			return Printer.ON_BEFORE_UNLOAD_MESSAGE;
		};
	}
}
