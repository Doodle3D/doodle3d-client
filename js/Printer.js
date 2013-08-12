function Printer() {
	this.temperature = 0;
	this.targetTemperature = 0;
	
	this.wifiboxURL; 
	
	this.maxTempLastMod = 5; // max time (seconds) since the last temp info modification before the printer connection is considered lost
	

	
	this.checkTemperatureInterval = 3000;
	this.checkTemperatureDelay;
	this.checkProgressInterval = 3000;
	this.checkProgressDelay;
	this.timeoutTime = 3000;
	
	// Events
	Printer.UPDATE = "update";
	
	this.init = function() {
    console.log("Printer:init");
		//this.wifiboxURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
		//this.wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";
		this.wifiboxURL = wifiboxURL;
		//this.wifiboxURL = "proxy5.php";
    console.log("  wifiboxURL: ",this.wifiboxURL);
    
    this.checkTemperature();
    this.checkProgress();
 	}
	
	this.preheat = function() {
    console.log("Printer:preheat");
		var postData = { id: 0 };
    var self = this;
    $.ajax({
		  url: this.wifiboxURL + "/printer/heatup",
		  type: "POST",
		  data: postData,
		  dataType: 'json',
		  timeout: this.timeoutTime,
		  success: function(data){
		  	console.log("Printer:preheat response: ",data);
			},
			error: function(jqXHR, status, errorThrown){   //the status returned will be "timeout" 
	 			//console.log("Printer:temperature error. Status: ",status,' errorThrown: ',errorThrown);
	 			switch(status) {
	 				case 'timeout':
		 				console.log("retrieving printer/heatup timeout");
		 				self.preheat(); 
	 					break;
	 			} 			
			}
		});
	}
	
	this.stop = function() {
    console.log("Printer:stop");
		var postData = { id: 0 };
    $.post( this.wifiboxURL + "/printer/stop", postData , function(e) {
      console.log("Printer:stop response: " + e);
      
      if (e.success = true) {
        console.log("  success");
      }
    });
	}
	
	this.checkTemperature = function() {
		//console.log("Printer:checkTemperature");
    var getData = { id: 0 };
    var self = this;
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
	      		self.targetTemperature = data.data.hotend_target;
	      	}
	      	self.alive = (data.data.last_mod < self.maxTempLastMod);
        } else {
        	self.alive = false;
        }
        //console.log("  this.alive: ",self.alive);
        $(document).trigger(Printer.UPDATE);
		  	
				self.checkTemperatureDelay = setTimeout(function() { self.checkTemperature() },self.checkTemperatureInterval);
			},
			error: function(jqXHR, status, errorThrown){   //the status returned will be "timeout" 
	 			//console.log("Printer:temperature error. Status: ",status,' errorThrown: ',errorThrown);
	 			switch(status) {
	 				case 'timeout':
		 				console.log("retrieving printer/temperature timeout");
		 				self.checkTemperature(); 
	 					break;
	 			} 			
			}
		});
	}
	this.checkProgress = function() {
		//console.log("Printer:checkProgress");
    var getData = { id: 0 };
		var self = this;
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
        } 
        //console.log("  this.alive: ",self.alive);
        $(document).trigger(Printer.UPDATE);
		  	
				self.checkProgressDelay = setTimeout(function() { self.checkProgress() },self.checkProgressInterval);
			},
			error: function(jqXHR, status, errorThrown){   //the status returned will be "timeout" 
	 			//console.log("Printer:progress error. Status: ",status,' errorThrown: ',errorThrown);
	 			switch(status) {
	 				case 'timeout':
		 				self.checkProgress(); 
		 				console.log("retrieving printer/progress timeout");
	 					break;
	 			} 			
			}
		});

	}
}