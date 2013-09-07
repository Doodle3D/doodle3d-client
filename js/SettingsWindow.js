//these settings are defined in the firmware (conf_defaults.lua) and will be initialized in loadSettings()
var settings = {
"network.ap.ssid": "d3d-ap-%%MAC_ADDR_TAIL%%",
"network.ap.address": "192.168.10.1",
"network.ap.netmask": "255.255.255.0",
"printer.temperature": 220,
"printer.objectHeight": 20,
"printer.maxObjectHeight": 150,
"printer.layerHeight": 0.2,
"printer.wallThickness": 0.7,
"printer.screenToMillimeterScale": 0.3,
"printer.speed": 50,
"printer.travelSpeed": 200,
"printer.filamentThickness": 2.85,
"printer.enableTraveling": true,
"printer.useSubLayers": true,
"printer.firstLayerSlow": true,
"printer.autoWarmUp": true,
"printer.simplify.iterations": 10,
"printer.simplify.minNumPoints": 15,
"printer.simplify.minDistance": 3,
"printer.retraction.enabled": true,
"printer.retraction.speed": 50,
"printer.retraction.minDistance": 1,
"printer.retraction.amount": 5,
"printer.autoWarmUpCommand": "M104 S220 (hardcoded temperature)"
}


function SettingsWindow() {
	this.wifiboxURL;
	this.window;
	this.form;
	this.timeoutTime = 3000;
	this.retryDelay = 2000; 					// retry setTimout delay
	this.retryLoadSettingsDelay; 			// retry setTimout instance
	this.retrySaveSettingsDelay; 			// retry setTimout instance
	this.retryRetrieveNetworkStatusDelay;// retry setTimout instance


	this.apFieldSet;
	this.clientFieldSet;
	this.networks;
	this.currentNetwork;               // the ssid of the network the box is on
  this.selectedNetwork;              // the ssid of the selected network in the client mode settings
  this.clientModeState = SettingsWindow.NOT_CONNECTED;
  this.currentAP;
  this.apModeState = SettingsWindow.NO_AP;

  // after switching wifi network or creating a access point we delay the status retrieval
  // because the webserver needs time to switch
  // this time is multiplied 3 times after access point creation
  this.retrieveNetworkStatusDelay;   // setTimout delay
  this.retrieveNetworkStatusDelayTime = 3000;

	// Events
	SettingsWindow.SETTINGS_LOADED = "settingsLoaded";

  // network client mode states
  SettingsWindow.NOT_CONNECTED   = "not connected";   // also used as first item in networks list
  SettingsWindow.CONNECTED       = "connected";
  SettingsWindow.CONNECTING      = "connecting";

  // network access point mode states
  SettingsWindow.NO_AP           = "no ap";
  SettingsWindow.AP              = "ap";
  SettingsWindow.CREATING_AP     = "creating ap";

	var self = this;

	this.init = function(wifiboxURL) {
		this.wifiboxURL = wifiboxURL;

		this.window = $("#settings");
		this.window.find(".btnOK").click(this.submitwindow);
	  this.window.find(".settings").load("settings.html", function() {
      console.log("Settings:finished loading settings.html, now loading settings...");

      self.form = self.window.find("form");
			self.form.submit(function (e) { self.submitwindow(e) });

      self.loadSettings();


      var btnAP 						= self.form.find("label[for='ap']");
		  var btnClient 				= self.form.find("label[for='client']");
		  var btnRefresh 				= self.form.find("#refreshNetworks");
		  var btnConnect 				= self.form.find("#connectToNetwork");
		  var btnCreate 				= self.form.find("#createAP");
		  var networkSelector 	= self.form.find("#network");
		  self.apFieldSet 			= self.form.find("#apSettings");
		  self.clientFieldSet 	= self.form.find("#clientSettings");

		  btnAP.on('touchstart mousedown',self.showAPSettings);
		  btnClient.on('touchstart mousedown',self.showClientSettings);
		  btnRefresh.on('touchstart mousedown',self.refreshNetworks);
		  btnConnect.on('touchstart mousedown',self.connectToNetwork);
			btnCreate.on('touchstart mousedown',self.createAP);
		  networkSelector.change(self.networkSelectorChanged);
	  });
	}
	this.submitwindow = function(e) {
		e.preventDefault();
	  e.stopPropagation();
	  self.saveSettings();
	  self.hideSettings();
	}

	this.showSettings = function() {
	  console.log("f:showSettings()");

	  this.loadSettings(); // reload settings

	  $("#contentOverlay").fadeIn(375, function() {
	    document.body.removeEventListener('touchmove',prevent,false);
	  });
	}
	this.hideSettings = function() {
		$("#contentOverlay").fadeOut(375, function() {
      document.body.addEventListener('touchmove',prevent,false);
    });
	}

	this.loadSettings = function() {
		if (!communicateWithWifibox) {
			console.log("     communicateWithWifibox is false: settings aren't being loaded from wifibox...")
			return;
		}
	  console.log("Settings:loadSettings() >> getting new data...");

		$.ajax({
		  url: this.wifiboxURL + "/config/all",
		  dataType: 'json',
		  timeout: this.timeoutTime,
		  success: function(data){
		  	console.log("Settings:loadSettings response: ",data);
        settings = data.data;
		  	console.log("  settings: ",settings);
		  	self.fillForm();
		  	$(document).trigger(SettingsWindow.SETTINGS_LOADED);
			}
		}).fail(function() {
			console.log("Settings:loadSettings: failed");
			clearTimeout(self.retryLoadSettingsDelay);
			self.retryLoadSettingsDelay = setTimeout(function() { self.loadSettings() },self.retryDelay); // retry after delay
		});

    this.refreshNetworks();
    this.retrieveNetworkStatus();
	}

	this.saveSettings = function(callback) {
	  console.log("Settings:saveSettings");

	  this.readForm();

	  if (communicateWithWifibox) {
		  $.ajax({
			  url: this.wifiboxURL + "/config",
			  type: "POST",
			  data: settings,
			  dataType: 'json',
			  timeout: this.timeoutTime,
			  success: function(data){
			  	console.log("Settings:saveSettings response: ",data);
			  	if(data.status == "error") {
			  		clearTimeout(self.retrySaveSettingsDelay);
						self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
			  	} else {
			  		var savedSettings = data.data;
				  	$.each(savedSettings, function(index, val) {
			        if (val != "ok") {
			          console.log("ERROR: value '" + index + "' not successfully set. Message: " + val);
			        }
			      });
			      // TODO something like a callback or feedback that saving went well / or failed
			      if (callback != undefined) {
			        callback();
			      }
			  	}
				}
			}).fail(function() {
				console.log("Settings:saveSettings: failed");
				clearTimeout(self.retrySaveSettingsDelay);
				self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
			});
	  }
	}

	this.fillForm = function() {
		console.log("SettingsWindow:fillForm");

		//fill form with loaded settings
		var selects = this.form.find("select");
		selects.each( function(index,element) {
			var element = $(element);
			element.val(settings[element.attr('name')]);
		});
		var inputs = this.form.find("input");
		inputs.each( function(index,element) {
			var element = $(element);
			//console.log("printer setting input: ",index,element.attr("type"),element.attr('name')); //,element);
			switch(element.attr("type")) {
				case "text":
				case "number":
					element.val(settings[element.attr('name')]);
					break;
				case "checkbox":
					element.prop('checked', settings[element.attr('name')]);
					break;
			}
		});
		var textareas = this.form.find("textarea");
		textareas.each( function(index,element) {
			var element = $(element);
			var value = settings[element.attr('name')];
			element.val(value);
		});
	}

	this.readForm = function() {
		console.log("SettingsWindow:readForm");
		var selects = this.form.find("select");
		selects.each( function(index,element) {
			var element = $(element);
			settings[element.attr('name')] = element.val();
		});

		var inputs = this.form.find("input");
		inputs.each( function(index,element) {
			var element = $(element);
			switch(element.attr("type")) {
				case "text":
				case "number":
					settings[element.attr('name')] = element.val();
					break;
				case "checkbox":
					settings[element.attr('name')] = element.prop('checked')
					break;
			}
		});

		var textareas = this.form.find("textarea");
		textareas.each( function(index,element) {
			var element = $(element);
			settings[element.attr('name')] = element.val();
		});
		console.log(settings);
	}


	/*
	 * Networks ui
	 */
	this.showAPSettings = function() {
		self.apFieldSet.show();
		self.clientFieldSet.hide();
	}
	this.showClientSettings = function() {
		self.clientFieldSet.show();
		self.apFieldSet.hide();
	}
	this.connectToNetwork = function() {
		console.log("Settings:connectToNetwork");
	}
	this.refreshNetworks = function() {
    console.log("Settings:refreshnetworks");

		if (communicateWithWifibox) {
		  $.ajax({
			  url: self.wifiboxURL + "/network/scan",
			  type: "GET",
			  dataType: 'json',
			  timeout: self.timeoutTime,
			  success: function(response){
			  	console.log("Settings:refreshNetworks response: ",response);
			  	if(response.status == "error") {
			  		//clearTimeout(self.retrySaveSettingsDelay);
						//self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
			  	} else {
			  		var networks = response.data.networks
			  		self.networks = {};
            var foundCurrentNetwork = false;
			  		var networkSelector = self.form.find("#network");
			  		networkSelector.empty();
            networkSelector.append(
								$("<option></option>").val(SettingsWindow.NOT_CONNECTED).html("not connected")
							);
			  		$.each(networks, function(index,element) {
              if(element.ssid == self.currentNetwork) {
                foundCurrentNetwork = true;
              }
							networkSelector.append(
								$("<option></option>").val(element.ssid).html(element.ssid)
							);
							self.networks[element.ssid] = element;
						});
            if(foundCurrentNetwork) {
              networkSelector.val(self.currentNetwork);
              self.selectNetwork(self.currentNetwork);
            } else {
              self.retrieveNetworkStatus();
            }
			  	}
				}
			}).fail(function() {
				console.log("Settings:saveSettings: failed");
				//clearTimeout(self.retrySaveSettingsDelay);
				//self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
			});
	  }
	}

  this.retrieveNetworkStatus = function() {
    console.log("Settings:retrieveNetworkStatus");
    if (communicateWithWifibox) {
		  $.ajax({
			  url: self.wifiboxURL + "/network/status",
			  type: "GET",
			  dataType: 'json',
			  timeout: self.timeoutTime,
			  success: function(response){
			  	console.log("Settings:updateNetworkStatus response: ",response);
			  	if(response.status == "error") {
			  		clearTimeout(self.retryRetrieveNetworkStatusDelay);
						self.retryRetrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus() },self.retryDelay); // retry after delay
			  	} else {
            var data = response.data;
            switch(data.mode) {
              case "sta":
                var networkSelector = self.form.find("#network");
                networkSelector.val(data.ssid);
                self.showClientSettings();
                self.form.find("#client").prop('checked',true);

                self.currentNetwork = data.ssid;
                self.selectNetwork(data.ssid);
                self.setClientModeState(SettingsWindow.CONNECTED);

                self.setAPModeState(SettingsWindow.NO_AP);
                break;
              case "ap":
                //self.form.find("#ssid").val(data.ssid);
                self.showAPSettings();
                self.form.find("#ap").prop('checked',true);
                self.currentAP = data.ssid;
                self.setAPModeState(SettingsWindow.AP);

                self.currentNetwork = undefined;
                self.selectNetwork(SettingsWindow.NOT_CONNECTED);
                self.setClientModeState(SettingsWindow.NOT_CONNECTED);
                break;
              default:
                self.showAPSettings();
                self.form.find("#ap").prop('checked',true);
                self.setAPModeState(SettingsWindow.NO_AP);

                self.currentNetwork = undefined;
                self.selectNetwork(SettingsWindow.NOT_CONNECTED);
                self.setClientModeState(SettingsWindow.NOT_CONNECTED);
                break;
            }
			  	}
				}
			}).fail(function() {
				console.log("Settings:updateNetworkStatus: failed");
				clearTimeout(self.retryRetrieveNetworkStatusDelay);
				self.retryRetrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus() },self.retryDelay); // retry after delay
			});
    }
  }

	this.networkSelectorChanged = function(e) {
		var selectedOption = $(this).find("option:selected");
		self.selectNetwork(selectedOption.val());
	}

	this.selectNetwork = function(ssid) {
		console.log("select network: ",ssid);
		this.selectedNetwork = ssid;
    if(this.networks == undefined || ssid == SettingsWindow.NOT_CONNECTED) {
      this.form.find("#passwordLabel").hide();
      this.form.find("#password").hide();
    } else {
      var network = this.networks[ssid];
      if(network.encryption == "none") {
        this.form.find("#passwordLabel").hide();
        this.form.find("#password").hide();
      } else {
        this.form.find("#passwordLabel").show();
        this.form.find("#password").show();
      }
      this.form.find("#password").val("");
    }
	}

  this.setClientModeState = function(state) {
    var field = this.form.find("#clientModeState");
	  var btnConnect 				= self.form.find("#connectToNetwork");
    switch(state) {
      case SettingsWindow.NOT_CONNECTED:
        btnConnect.removeAttr("disabled");
        field.html("Not connected");
        break;
      case SettingsWindow.CONNECTED:
        btnConnect.removeAttr("disabled");
        field.html("Connected to: "+this.currentNetwork);
        break;
      case SettingsWindow.CONNECTING:
        btnConnect.attr("disabled", true);
        field.html("Connecting...");
        break;
    }
    this.clientModeState = state;
  }

	this.connectToNetwork = function() {
		console.log("connectToNetwork");
		if(self.selectedNetwork == undefined) return;
		postData = {
			ssid:self.selectedNetwork,
			phrase:self.form.find("#password").val()
		}
		console.log("  postData: ",postData);
		if (communicateWithWifibox) {
		  $.ajax({
			  url: self.wifiboxURL + "/network/associate",
			  type: "POST",
			  data: postData,
			  dataType: 'json',
			  timeout: self.timeoutTime,
			  success: function(response){
			  	console.log("Settings:connectToNetwork response: ",response);

				}
			}).fail(function() {
				console.log("Settings:connectToNetwork: timeout (normal behaivior)");
				//clearTimeout(self.retrySaveSettingsDelay);
				//self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
			});
	  }
    self.setClientModeState(SettingsWindow.CONNECTING);

    // we delay the status retrieval because the webserver needs time to switch
    clearTimeout(self.retrieveNetworkStatusDelay);
		self.retrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus() },self.retrieveNetworkStatusDelayTime); // retry after delay
	}

  this.createAP = function() {
		if (communicateWithWifibox) {
		  $.ajax({
			  url: self.wifiboxURL + "/network/openap",
			  type: "POST",
			  dataType: 'json',
			  timeout: self.timeoutTime,
			  success: function(response){
			  	console.log("Settings:createAP response: ",response);

				}
			}).fail(function() {
				console.log("Settings:createAP: timeout (normal behaivior)");
				//clearTimeout(self.retrySaveSettingsDelay);
				//self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
			});
	  }
    self.setAPModeState(SettingsWindow.CREATING_AP);

    // we delay the status retrieval because the webserver needs time to switch
    clearTimeout(self.retrieveNetworkStatusDelay);
		self.retrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus() },self.retrieveNetworkStatusDelayTime*3); // retry after delay
  }

  this.setAPModeState = function(state) {
    var field = this.form.find("#apModeState");
    var btnCreate = this.form.find("#createAP");
    switch(state) {
      case SettingsWindow.NO_AP:
        btnCreate.removeAttr("disabled");
        field.html("Not currently a access point");
        break;
      case SettingsWindow.AP:
        btnCreate.removeAttr("disabled");
        field.html("Is access point: "+this.currentAP);
        break;
      case SettingsWindow.CREATING_AP:
        btnCreate.attr("disabled", true);
        field.html("Creating access point...");
        break;
    }
    this.apModeState = state;
  }
}

/*************************
 *
 *
 *  FROM DOODLE3D.INI
 *
 */
//TODO: find all references to these variables, replace them and finally remove these.
var objectHeight = 20;
var layerHeight = .2;
//var wallThickness = .5;
//var hop = 0;
//var speed = 70;
//var travelSpeed = 200;
var enableTraveling = true;
//var filamentThickness = 2.89;
var minScale = .3;
var maxScale = 1;
var shape = "%";
var twists = 0;
//var useSubLayers = true;
//var debug = false; // debug moved to main.js
var loglevel = 2;
//var zOffset = 0;
var serverport = 8888;
var autoLoadImage = "hand.txt";
var loadOffset = [0, 0]; // x en y ?
var showWarmUp = true;
var loopAlways = false;
var firstLayerSlow = true;
var useSubpathColors = false;
var autoWarmUp = true;
//var maxObjectHeight = 150;
var maxScaleDifference = .1;
var frameRate = 60;
var quitOnEscape = true;
var screenToMillimeterScale = .3; // 0.3
//var targetTemperature = 220;
//var simplifyiterations = 10;
//var simplifyminNumPoints = 15;
//var simplifyminDistance = 3;
//var retractionspeed = 50;
//var retractionminDistance = 5;
//var retractionamount = 3;
var sideis3D = true;
var sidevisible = true;
var sidebounds = [900, 210, 131, 390];
var sideborder = [880, 169, 2, 471];
var windowbounds = [0, 0, 800, 500];
var windowcenter = true;
var windowfullscreen = false;
var autoWarmUpCommand = "M104 S230";
//var checkTemperatureInterval = 3;
var autoWarmUpDelay = 3;
