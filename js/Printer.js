function Printer() {
	this.temperature = 0;
	this.targetTemperature = 0;
	
	this.wifiboxURL; 
	
	this.checkTemperatureIntervalTime = 1000;
	this.checkTemperatureInterval; 
	
	this.maxTempLastMod = 5; // max time (seconds) since the last temp info modification before the printer connection is considered lost
	
	// Events
	Printer.UPDATE = "update";
	
	this.init = function() {
    console.log("Printer:init");
		//this.wifiboxURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
		//this.wifiboxURL = "http://192.168.5.1/cgi-bin/d3dapi";
		this.wifiboxURL = wifiboxURL;
		//this.wifiboxURL = "proxy5.php";
    console.log("  wifiboxURL: ",this.wifiboxURL);
    
    var self = this;
    this.checkTemperatureInterval = setInterval(function() { self.checkTemperature(); },this.checkTemperatureIntervalTime);
 	}
	
	this.preheat = function() {
    console.log("Printer:preheat");
		var postData = { id: 0 };
    $.post( this.wifiboxURL + "/printer/heatup", postData , function(e) {
      console.log("Printer:preheat response: " + e);
      
      if (e.success = true) {
        console.log("  success");
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
    $.get( this.wifiboxURL + "/printer/temperature", getData , function(e) {
      //console.log("Printer:temperature response: " + e);

      if (e.success = true) {
	      var response = jQuery.parseJSON(e);
  	    //console.log("response: ",response);  
	      
	      if(response.status == "success") {
	      	//console.log("temp: ",response.data.hotend+"/"+response.data.hotend_target+" ("+response.data.last_mod+")");
	      	
	      	self.temperature = response.data.hotend;
	      	if(response.data.hotend_target != undefined) {
	      		self.targetTemperature = response.data.hotend_target;
	      	}
	      	
	      	self.alive = (response.data.last_mod < self.maxTempLastMod);
        } else {
        	self.alive = false;
        }
        //console.log("  this.alive: ",self.alive);
        $(document).trigger(Printer.UPDATE);
      }
    });
	}
}