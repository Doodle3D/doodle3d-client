//these settings are defined in the firmware (conf_defaults.lua) and will be initialized in loadSettings()
var settings = {
"network.ap.ssid": "d3d-ap-%%MAC_ADDR_TAIL%%",
"network.ap.address": "192.168.10.1",
"network.ap.netmask": "255.255.255.0",
"printer.temperature": 220,
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


//wrapper to prevent scoping issues in showSettings()
function openSettingsWindow() {
	settingsWindow.showSettings();
}

function SettingsWindow() {
	this.wifiboxURL;
	this.wifiboxCGIBinURL
	this.window;
	this.btnOK;
	this.form;
	this.timeoutTime = 3000;
	this.retryDelay = 2000; 					// retry setTimout delay
	this.retryRetrieveNetworkStatusDelayTime = 1000;// retry setTimout delay

	this.retryLoadSettingsDelay; 			// retry setTimout instance
	this.retrySaveSettingsDelay; 			// retry setTimout instance
	this.retryRetrieveNetworkStatusDelay;// retry setTimout instance


	this.apFieldSet;
	this.clientFieldSet;
	this.networks;
	this.currentNetwork;               // the ssid of the network the box is on
  this.selectedNetwork;              // the ssid of the selected network in the client mode settings
  this.currentLocalIP = "";
  this.clientModeState = SettingsWindow.NOT_CONNECTED;
  this.currentAP;
  this.apModeState = SettingsWindow.NO_AP;

  // after switching wifi network or creating a access point we delay the status retrieval
  // because the webserver needs time to switch
  this.retrieveNetworkStatusDelay;   // setTimout delay
  this.retrieveNetworkStatusDelayTime = 1000;

	// Events
	SettingsWindow.SETTINGS_LOADED 		= "settingsLoaded";

  // network client mode states
  SettingsWindow.NOT_CONNECTED   		= "not connected";   // also used as first item in networks list
  SettingsWindow.CONNECTED       		= "connected";
  SettingsWindow.CONNECTING      		= "connecting";
  SettingsWindow.CONNECTING_FAILED	= "connecting failed"

  // network access point mode states
  SettingsWindow.NO_AP           		= "no ap";
  SettingsWindow.AP              		= "ap";
  SettingsWindow.CREATING_AP     		= "creating ap";

  SettingsWindow.API_CONNECTING_FAILED  = -1
  SettingsWindow.API_NOT_CONNECTED 			= 0
  SettingsWindow.API_CONNECTING 				= 1
  SettingsWindow.API_CONNECTED 					= 2
  SettingsWindow.API_CREATING 					= 3
  SettingsWindow.API_CREATED 						= 4

  // network mode
  SettingsWindow.NETWORK_MODE_NEITHER  			= "neither";
  SettingsWindow.NETWORK_MODE_CLIENT  			= "clientMode";
  SettingsWindow.NETWORK_MODE_ACCESS_POINT  = "accessPointMode";

  this.networkMode = SettingsWindow.NETWORK_MODE_NEITHER;

  this.updatePanel = new UpdatePanel();

	var self = this;

	this.init = function(wifiboxURL,wifiboxCGIBinURL) {
		this.wifiboxURL = wifiboxURL;
		this.wifiboxCGIBinURL = wifiboxCGIBinURL;

		this.window = $("#settings");
		this.btnOK = this.window.find(".btnOK");
		enableButton(this.btnOK,this.submitwindow);
	  
		this.window.find(".settingsContainer").load("settings.html", function() {
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

		  // update panel
		  var $updatePanelElement = self.form.find("#updatePanel");
		  self.updatePanel.init(wifiboxURL,$updatePanelElement);
	  });
	}
	this.submitwindow = function(e) {
		disableButton(self.btnOK,self.submitwindow);
		e.preventDefault();
	  e.stopPropagation();
	  self.saveSettings(self.readForm(),function(success){
	  	if(success) {
				self.hideSettings(function() {
					enableButton(self.btnOK,self.submitwindow);
				});
	  	} else {
	  		enableButton(self.btnOK,self.submitwindow);
	  	}
	  });

	  clearTimeout(self.retryRetrieveNetworkStatusDelay);
	}

	this.showSettings = function() {
	  console.log("f:showSettings()");

	  this.loadSettings(); // reload settings
//		this.window.css("display","table");
	  $("#contentOverlay").fadeIn(375, function() {
	    document.body.removeEventListener('touchmove',prevent,false);
	  });
	}
	this.hideSettings = function(complete) {
		$("#contentOverlay").fadeOut(375, function() {
      document.body.addEventListener('touchmove',prevent,false);
//      self.window.css("display","none");
      complete();
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
		  success: function(response){
		  	console.log("Settings:loadSettings response: ",response);
        settings = response.data;
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
    this.retrieveNetworkStatus(false);
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

	this.saveSettings = function(newSettings,complete) {
		settings = newSettings; // store new settings in global settings
		if (communicateWithWifibox) {
		  $.ajax({
			  url: this.wifiboxURL + "/config",
			  type: "POST",
			  data: newSettings,
			  dataType: 'json',
			  timeout: this.timeoutTime,
			  success: function(response){
			  	console.log("Settings:saveSettings response: ",response);
			  	if(response.status == "error") {
			  		clearTimeout(self.retrySaveSettingsDelay);
						self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings(settings,complete) },self.retryDelay); // retry after delay
			  	} else {
			  		var data = response.data;
			  		var validation = data.validation;
			  		self.clearValidationErrors();
			  		var validated = true;
				  	$.each(validation, function(key, val) {
			        if (val != "ok") {
			          console.log("ERROR: setting '" + key + "' not successfully set. Message: " + val);
			          self.displayValidationError(key,val);
			          validated = false;
			        }
			      });
				  	settings.substituted_ssid = data.substituted_ssid;
				  	if(complete) complete(validated);
			  	}
				}
			}).fail(function() {
				console.log("Settings:saveSettings: failed");
				clearTimeout(self.retrySaveSettingsDelay);
				self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings(settings,complete) },self.retryDelay); // retry after delay
			});
	  }
	}
	this.displayValidationError = function(key,msg) {
		var formElement = self.form.find("[name|='"+key+"']");
		formElement.addClass("error");
		var errorMsg = "<p class='errorMsg'>"+msg+"</p>"
		formElement.after(errorMsg);
	}
	this.clearValidationErrors = function() {
		self.form.find(".errorMsg").remove();
		self.form.find(".error").removeClass("error");
	}

	this.readForm = function() {
		//console.log("SettingsWindow:readForm");
		var settings = {};
		var selects = self.form.find("select");
		selects.each( function(index,element) {
			var element = $(element);
			if(element.attr('name') != "network.client.network") {
				settings[element.attr('name')] = element.val();
			}
		});

		var inputs = self.form.find("input");
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

		var textareas = self.form.find("textarea");
		textareas.each( function(index,element) {
			var element = $(element);
			settings[element.attr('name')] = element.val();
		});
		//console.log(settings);
		return settings;
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
	this.refreshNetworks = function() {
    console.log("Settings:refreshNetworks");

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
            }
			  	}
				}
			}).fail(function() {

			});
	  }
	}

  this.retrieveNetworkStatus = function(connecting) {
    //console.log("Settings:retrieveNetworkStatus");
    if (communicateWithWifibox) {
		  $.ajax({
			  url: self.wifiboxURL + "/network/status",
			  type: "GET",
			  dataType: 'json',
			  timeout: self.timeoutTime,
			  success: function(response){
			  	console.log("Settings:retrieveNetworkStatus response: ",response);
			  	if(response.status == "error") {

			  	} else {
            var data = response.data;

            if(typeof data.status === 'string') {
            	data.status = parseInt(data.status);
            }
            //console.log("  data.status: ",data.status,data.statusMessage);

            // Determine which network settings to show
            switch(data.status) {
              case SettingsWindow.API_NOT_CONNECTED:
              	//console.log("  not connected & not a access point");
          			self.apFieldSet.show();
          			self.clientFieldSet.show();

          			self.networkMode = SettingsWindow.NETWORK_MODE_NEITHER;
              	break;
							case SettingsWindow.API_CONNECTING_FAILED:
							case SettingsWindow.API_CONNECTING:
							case SettingsWindow.API_CONNECTED:
								//console.log("  client mode");
								self.form.find("#client").prop('checked',true);

								self.apFieldSet.hide();
							  self.clientFieldSet.show();

								if(data.status == SettingsWindow.API_CONNECTED) {
									var networkSelector = self.form.find("#network");
									networkSelector.val(data.ssid);

									self.currentNetwork = data.ssid;
									self.currentLocalIP = data.localip;
									self.selectNetwork(data.ssid);
								} else {
									self.currentLocalIP = ""
								}
								self.networkMode = SettingsWindow.NETWORK_MODE_CLIENT;
								break;
							case SettingsWindow.API_CREATING:
							case SettingsWindow.API_CREATED:
								//console.log("  access point mode");
								self.form.find("#ap").prop('checked',true);

								self.apFieldSet.show();
								self.clientFieldSet.hide();

								self.currentNetwork = undefined;
								self.selectNetwork(SettingsWindow.NOT_CONNECTED);
								var networkSelector = self.form.find("#network");
								networkSelector.val(SettingsWindow.NOT_CONNECTED);

								if(data.ssid && data.status == SettingsWindow.API_CREATED) {
										self.currentAP = data.ssid;
								}
								self.networkMode = SettingsWindow.NETWORK_MODE_ACCESS_POINT;
								break;
						}
            self.updatePanel.setNetworkMode(self.networkMode);

            // update status message
            switch(data.status) {
            	case SettingsWindow.API_CONNECTING_FAILED:
            		self.setClientModeState(SettingsWindow.CONNECTING_FAILED,data.statusMessage);
            		self.setAPModeState(SettingsWindow.NO_AP,"");
								break;
            	case SettingsWindow.API_NOT_CONNECTED:
            		self.setClientModeState(SettingsWindow.NOT_CONNECTED,"");
            	  self.setAPModeState(SettingsWindow.NO_AP,"");
								break;
            	case SettingsWindow.API_CONNECTING:
            		self.setClientModeState(SettingsWindow.CONNECTING,"");
            	  self.setAPModeState(SettingsWindow.NO_AP,"");
            		break;
            	case SettingsWindow.API_CONNECTED:
            		self.setClientModeState(SettingsWindow.CONNECTED,"");
            	 	self.setAPModeState(SettingsWindow.NO_AP,"");
								break;
            	case SettingsWindow.API_CREATING:
            		self.setClientModeState(SettingsWindow.NOT_CONNECTED,"");
            		self.setAPModeState(SettingsWindow.CREATING_AP,"");
            		break;
            	case SettingsWindow.API_CREATED:
            		self.setClientModeState(SettingsWindow.NOT_CONNECTED,"");
            		self.setAPModeState(SettingsWindow.AP,"");
								break;
            }

            // Keep checking for updates?
            if(connecting) {
							switch(data.status) {
								case SettingsWindow.API_CONNECTING:
								case SettingsWindow.API_CREATING:
									clearTimeout(self.retryRetrieveNetworkStatusDelay);
									self.retryRetrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus(connecting) },self.retryRetrieveNetworkStatusDelayTime); // retry after delay
									break;
							}
            }
			  	}
				}
			}).fail(function() {
				console.log("Settings:retrieveNetworkStatus: failed");
				clearTimeout(self.retryRetrieveNetworkStatusDelay);
				self.retryRetrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus(connecting) },self.retryDelay); // retry after delay
			});
    }
  }

	this.networkSelectorChanged = function(e) {
		var selectedOption = $(this).find("option:selected");
		self.selectNetwork(selectedOption.val());
	}

	this.selectNetwork = function(ssid) {
		console.log("select network: ",ssid);
		if(ssid == "") return;
		console.log("  checked");
		this.selectedNetwork = ssid;
    if(this.networks == undefined || ssid == SettingsWindow.NOT_CONNECTED) {
    	this.hideWiFiPassword();
    } else {
      var network = this.networks[ssid];
      if(network.encryption == "none") {
      	this.hideWiFiPassword();
      } else {
      	this.showWiFiPassword();
      }
      this.form.find("#password").val("");
    }
	}
	this.showWiFiPassword = function() {
	  this.form.find("#passwordLabel").show();
		this.form.find("#password").show();
	}
	this.hideWiFiPassword = function() {
		this.form.find("#passwordLabel").hide();
		this.form.find("#password").hide();
	}

  this.setClientModeState = function(state,msg) {
    var field = this.form.find("#clientModeState");
	  var btnConnect 				= self.form.find("#connectToNetwork");
    switch(state) {
      case SettingsWindow.NOT_CONNECTED:
        btnConnect.removeAttr("disabled");
        field.html("Not connected");
        break;
      case SettingsWindow.CONNECTED:
        btnConnect.removeAttr("disabled");

      	var fieldText = "Connected to: <b>"+this.currentNetwork+"</b>.";
      	if(this.currentLocalIP != undefined && this.currentLocalIP != "") {
      		var a = "<a href='http://"+this.currentLocalIP+"' target='_black'>"+this.currentLocalIP+"</a>";
      		fieldText += " (IP: "+a+")";
      	}
        field.html(fieldText);
        break;
      case SettingsWindow.CONNECTING:
        btnConnect.attr("disabled", true);
        field.html("Connecting... Reconnect by connecting your device to <b>"+this.selectedNetwork+"</b> and going to <a href='http://connect.doodle3d.com'>connect.doodle3d.com</a>");
        break;
      case SettingsWindow.CONNECTING_FAILED:
      	btnConnect.removeAttr("disabled");
      	field.html(msg);
      	break;
    }
    this.clientModeState = state;
  }
  this.setAPModeState = function(state,msg) {
		var field = this.form.find("#apModeState");
		var btnCreate = this.form.find("#createAP");
		switch(state) {
			case SettingsWindow.NO_AP:
				btnCreate.removeAttr("disabled");
				field.html("Not currently a access point");
				break;
			case SettingsWindow.AP:
				btnCreate.removeAttr("disabled");
				field.html("Is access point: <b>"+this.currentAP+"</b>");
				break;
			case SettingsWindow.CREATING_AP:
				btnCreate.attr("disabled", true);
				field.html("Creating access point... Reconnect by connecting your device to <b>"+settings.substituted_ssid+"</b> and going to <a href='http://draw.doodle3d.com'>draw.doodle3d.com</a>");
				break;
		}
		this.apModeState = state;
	}

	this.connectToNetwork = function() {
		console.log("connectToNetwork");
		if(self.selectedNetwork == undefined) return;
		var postData = {
			ssid:self.selectedNetwork,
			phrase:self.form.find("#password").val(),
      recreate:true
		}
		console.log("  postData: ",postData);
		if (communicateWithWifibox) {

			// save network related settings and on complete, connect to network
			self.saveSettings(self.readForm(),function(success) {
				if(!success) return;
				$.ajax({
					url: self.wifiboxCGIBinURL + "/network/associate",
					type: "POST",
					data: postData,
					dataType: 'json',
					timeout: self.timeoutTime,
					success: function(response){
						console.log("Settings:connectToNetwork response: ",response);
					}
				}).fail(function() {
					console.log("Settings:connectToNetwork: timeout (normal behavior)");
					//clearTimeout(self.retrySaveSettingsDelay);
					//self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
				});
			});
	  }
    self.setClientModeState(SettingsWindow.CONNECTING,"");

    // after switching wifi network or creating a access point we delay the status retrieval
    // because the webserver needs time to switch
		clearTimeout(self.retrieveNetworkStatusDelay);
		self.retrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus(true) },self.retrieveNetworkStatusDelayTime);
	}

  this.createAP = function() {
  	console.log("createAP");
		if (communicateWithWifibox) {

			// save network related settings and on complete, create access point
			self.saveSettings(self.readForm(),function(success) {
				if(!success) return;
				self.setAPModeState(SettingsWindow.CREATING_AP); // get latest substituted ssid
				$.ajax({
					url: self.wifiboxCGIBinURL + "/network/openap",
					type: "POST",
					dataType: 'json',
					timeout: self.timeoutTime,
					success: function(response){
						console.log("Settings:createAP response: ",response);
					}
				}).fail(function() {
					console.log("Settings:createAP: timeout (normal behavior)");
					//clearTimeout(self.retrySaveSettingsDelay);
					//self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings() },self.retryDelay); // retry after delay
				});

				self.setAPModeState(SettingsWindow.CREATING_AP,"");

				// after switching wifi network or creating a access point we delay the status retrieval
				// because the webserver needs time to switch
				clearTimeout(self.retrieveNetworkStatusDelay);
				self.retrieveNetworkStatusDelay = setTimeout(function() { self.retrieveNetworkStatus(true) },self.retrieveNetworkStatusDelayTime);
			});
	  }
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
