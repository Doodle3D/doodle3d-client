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


function SettingsWindow() {
	this.wifiboxURL;
	this.wifiboxCGIBinURL
	this.window;
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
		this.window.find(".btnOK").click(this.submitwindow);
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
		e.preventDefault();
	  e.stopPropagation();
	  self.saveSettings(self.readForm(),function(){
	  	self.hideSettings();
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
	this.hideSettings = function() {
		$("#contentOverlay").fadeOut(375, function() {
      document.body.addEventListener('touchmove',prevent,false);
//      self.window.css("display","none");
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
						self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings(settings) },self.retryDelay); // retry after delay
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
				  	if(complete && validated) complete();
			  	}
				}
			}).fail(function() {
				console.log("Settings:saveSettings: failed");
				clearTimeout(self.retrySaveSettingsDelay);
				self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings(settings) },self.retryDelay); // retry after delay
			});
	  }
	}
	this.displayValidationError = function(key,msg) {
		var formElement = self.form.find("[name|='"+key+"']");
		console.log("formElement: ",formElement);
		formElement.addClass("error");
		var errorMsg = "<p class='errorMsg'>"+msg+"</p>"
		formElement.after(errorMsg);
	}
	this.clearValidationErrors = function() {
		var formElements = self.form.find(".error");
		formElements.each( function(index,element) {
			$(element).removeClass("error");
		});
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
			self.saveSettings(self.readForm(),function() {
				
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
			self.saveSettings(self.readForm(),function() {
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

function UpdatePanel() {
	this.wifiboxURL;
	this.element;
	
	this.statusCheckInterval 	= 1000; 
	this.statusCheckDelayer; 						// setTimout instance
	this.installedDelay 			= 60*1000; 			// Since we can't retrieve status during installation we show the installed text after a fixed delay	
	this.installedDelayer; 							// setTimout instance
	this.retryDelay 					= 1000; 
	this.retryDelayer; 									// setTimout instance
	//this.timeoutTime 					= 3000;
	
	this.canUpdate 						= false;
	this.currentVersion				= "";
	this.newestVersion;	
	this.progress;
	this.imageSize;
	
	// states from api, see Doodle3D firmware src/script/d3d-updater.lua
	UpdatePanel.NONE 								= 1; // default state 
  UpdatePanel.DOWNLOADING  				= 2;
  UpdatePanel.DOWNLOAD_FAILED 		= 3;
  UpdatePanel.IMAGE_READY 				= 4; // download successfull and checked 
  UpdatePanel.INSTALLING 					= 5;
  UpdatePanel.INSTALLED 					= 6;
  UpdatePanel.INSTALL_FAILED 			= 7;
  
  this.state; // update state from api
  this.stateText = ""; // update state text from api
  
  this.networkMode; // network modes from SettingsWindow
  
	var self = this;

	this.init = function(wifiboxURL,updatePanelElement) {
		
		this.wifiboxURL = wifiboxURL;
		
		this.element = updatePanelElement;
		this.btnUpdate = this.element.find("#update");
		this.statusDisplay = this.element.find("#updateState");
		this.infoDisplay = this.element.find("#updateInfo");
		
		this.btnUpdate.click(this.update);
		
		this.checkStatus(false);
	}
	
	this.update = function() {
		console.log("UpdatePanel:update");
		self.downloadUpdate();
	}
	this.downloadUpdate = function() {
		console.log("UpdatePanel:downloadUpdate");
		$.ajax({
			url: self.wifiboxURL + "/update/download",
			type: "POST",
			dataType: 'json',
			success: function(response){
				console.log("UpdatePanel:downloadUpdate response: ",response);
			}
		}).fail(function() {
			console.log("UpdatePanel:downloadUpdate: failed");
		});
		self.setState(UpdatePanel.DOWNLOADING);
		self.startCheckingStatus();
	}
	this.installUpdate = function() {
		console.log("UpdatePanel:installUpdate");
		self.stopCheckingStatus();
		$.ajax({
			url: self.wifiboxURL + "/update/install",
			type: "POST",
			dataType: 'json',
			success: function(response){
				console.log("UpdatePanel:installUpdate response: ",response);
			}
		}).fail(function() {
			console.log("UpdatePanel:installUpdate: no respons (there shouldn't be)");
		});
		self.setState(UpdatePanel.INSTALLING);
		
		clearTimeout(self.installedDelayer);
		self.installedDelayer = setTimeout(function() { self.setState(UpdatePanel.INSTALLED) },self.installedDelay);
	}
	
	this.startCheckingStatus = function() {
		clearTimeout(self.statusCheckDelayer);
		clearTimeout(self.retryDelayer);
		self.statusCheckDelayer = setTimeout(function() { self.checkStatus(true) },self.statusCheckInterval);
	}
	this.stopCheckingStatus = function() {
		clearTimeout(self.statusCheckDelayer);
		clearTimeout(self.retryDelayer);
	}
	this.checkStatus = function(keepChecking) {
    if (!communicateWithWifibox) return;
		$.ajax({
			url: self.wifiboxURL + "/update/status",
			type: "GET",
			dataType: 'json',
			//timeout: self.timeoutTime,
			success: function(response){
				console.log("UpdatePanel:checkStatus response: ",response);
				
				// Keep checking ?
				if(keepChecking) {
					switch(self.state){
						case UpdatePanel.DOWNLOADING: 
						case UpdatePanel.INSTALLING:
							clearTimeout(self.statusCheckDelayer);
							self.statusCheckDelayer = setTimeout(function() { self.checkStatus(keepChecking) },self.statusCheckInterval);
							break;
					}
				}
				
				if(response.status != "error") {
					var data = response.data;
					self.handleStatusData(data);
				}
			}
		}).fail(function() {
			//console.log("UpdatePanel:checkStatus: failed");
			if(keepChecking) {
				clearTimeout(self.retryDelayer);
				self.retryDelayer = setTimeout(function() { self.checkStatus(keepChecking) },self.retryDelay); // retry after delay
			}
		});
	}
	
	this.handleStatusData = function(data) {
		//console.log("UpdatePanel:handleStatusData");
		self.canUpdate 				= data.can_update;
		
		if(self.currentVersion != data.current_version || self.newestVersion != data.newest_version) {
			self.currentVersion 	= data.current_version;
			self.newestVersion 		= data.newest_version;
			self.updateInfoDisplay();
		}
		
		self.stateText 				= data.state_text;
		self.progress 				= data.progress; // not always available
		self.imageSize 				= data.image_size; // not always available
		
		self.setState(data.state_code);
		
		switch(this.state){
			case UpdatePanel.IMAGE_READY:
				self.installUpdate();
				break;
		}
	}
	this.setState = function(newState) {
		if(this.state == newState) return;
		console.log("UpdatePanel:setState: ",this.state," > ",newState,"(",this.stateText,") (networkMode: ",self.networkMode,") (newestVersion: ",self.newestVersion,")");
		this.state = newState;
		
		// download button
		// if there isn't newestVersion data something went wrong, 
		//   probably accessing the internet  
		if(self.newestVersion != undefined) {
			switch(this.state){
				case UpdatePanel.NONE: 
				case UpdatePanel.DOWNLOAD_FAILED:
				case UpdatePanel.INSTALL_FAILED:
					if(self.canUpdate) {
						self.btnUpdate.removeAttr("disabled");
					} else {
						self.btnUpdate.attr("disabled", true);
					}
					break;
				default:
					self.btnUpdate.attr("disabled", true);
					break;
			}
		} else {
			self.btnUpdate.attr("disabled", true);
		}
		this.updateStatusDisplay();
	}
	this.updateStatusDisplay = function() {
		var text = "";
		if(self.newestVersion != undefined) {
			switch(this.state){
				case UpdatePanel.NONE:
					if(self.canUpdate) {
						text = "Update(s) available.";
					} else {
						text = "You're up to date.";
					}
					break;
				case UpdatePanel.DOWNLOADING: 
					text = "Downloading update...";
					break;
				case UpdatePanel.DOWNLOAD_FAILED: 
					text = "Downloading update failed.";
					break;
				case UpdatePanel.IMAGE_READY: 
					text = "Update downloaded.";
					break;
				case UpdatePanel.INSTALLING: 
					text = "Installing update... (will take a minute)";
					break;
				case UpdatePanel.INSTALLED: 
					text = "Update complete, please <a href='javascript:location.reload(true);'>refresh Page</a>.";
					break;
				case UpdatePanel.INSTALL_FAILED: 
					text = "Installing update failed.";
					break;
			}
		} else {
			if(self.networkMode == SettingsWindow.NETWORK_MODE_ACCESS_POINT) {
				text = "Can't access internet in access point mode.";
			} else {
				text = "Can't access internet.";
			}
		}
		this.statusDisplay.html(text);
	}
	this.updateInfoDisplay = function() {
		var text = "Current version: "+self.currentVersion+". ";
		if(self.canUpdate) {
			text += "Latest version: "+self.newestVersion+".";
		}
		self.infoDisplay.text(text);
	}
	this.setNetworkMode = function(networkMode) {
		self.networkMode = networkMode;
	}
}
function setTemperature(callback) {

  if (callback != undefined) callback();

}
function setTemperature(callback) {

  if (callback != undefined) callback();

}
var VERTICALSHAPE;
var verticalShapes = {
  "NONE": 'none',
  "DIVERGING": 'diverging',
  "CONVERGING": 'converging',
  "SINUS": 'sinus'
};

function initVerticalShapes() {
  // TODO give these vertical shapes a better spot
  VERTICALSHAPE = verticalShapes.NONE;
  $(".verticalShapes, .straight").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("diverging");
    VERTICALSHAPE = verticalShapes.NONE;
    redrawRenderedPreview();
  })
  $(".verticalShapes, .diverging").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("diverging");
    VERTICALSHAPE = verticalShapes.DIVERGING;
    redrawRenderedPreview();
  })
  $(".verticalShapes, .converging").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("converging");
    VERTICALSHAPE = verticalShapes.CONVERGING;
    redrawRenderedPreview();
  })
  $(".verticalShapes, .sinus").on('mouseup touchend', function(e) {
    e.preventDefault();
    console.log("sinus");
    VERTICALSHAPE = verticalShapes.SINUS;
    redrawRenderedPreview();
  })

}

function resetVerticalShapes() {
  VERTICALSHAPE = verticalShapes.NONE;
}
var btnMoveUpInterval;
var btnMoveDownInterval;

var btnTwistLeftInterval;
var btnTwistRightInterval;
var twistIncrement = Math.PI/1800;

var btnOopsInterval;

var btnNew, btnPrevious, btnNext;
var btnOops, btnStop, btnClear;
var btnMoveUp, btnMoveDown, btnTwistLeft, btnTwistRight;
var btnInfo, btnSettings;
//var btnDebug; // debug

var state;
var prevState;
var hasControl;

var gcodeGenerateDelayer;
var gcodeGenerateDelay = 50;

function initButtonBehavior() {
  console.log("f:initButtonBehavior");

//  btnClear= $(".btnClear");
  btnOops = $(".btnOops");
  btnMoveUp = $("#btnMoveUp");
  btnMoveDown = $("#btnMoveDown");
  btnTwistLeft = $("#btnTwistLeft");
  btnTwistRight = $("#btnTwistRight");
  btnInfo = $(".btnInfo");
  btnSettings = $(".btnSettings");
  btnNew = $(".btnNew");
  btnPrint= $(".btnPrint");
  btnStop = $(".btnStop");

  btnPrevious = $(".btnPrevious");
  btnNext = $(".btnNext");

  //debug
  //btnDebug = $(".debugBtn");

	btnNew.on('touchstart mousedown', clearDoodle);
	btnPrint.on('touchstart mousedown', print);

	// not using these at the moment
	$("#btnPrevious").css("opacity", "0.3");
	btnNext.css("opacity", "0.3");
	$("#btnSave").css("opacity", "0.3");
	btnInfo.css("opacity", "0.3");

//  btnClear.click(function(e) {
//    e.preventDefault();
//    //      console.log("clear");
//
//    clearDoodle();
//  });

  function startOops(e) {
    //      console.log("btnOops mouse down");
    e.preventDefault();
    btnOopsInterval = setInterval( function() {
      oopsUndo();
    }, 1000/50);
  }
  function stopOops(e) {
    //      console.log("btnOops mouse up");
    e.preventDefault();
    clearInterval(btnOopsInterval);
  }
  btnOops.on('touchstart', function(e) { startOops(e); });
  btnOops.on('touchend', function(e) { stopOops(e); });
  btnOops.mousedown(function(e) { startOops(e); });
  btnOops.mouseup(function(e) { stopOops(e); });

  function startMoveUp(e) {
    e.preventDefault();
    //      console.log("btnMoveUp mouse down");
    previewUp(true);
    clearInterval(btnMoveUpInterval);
    btnMoveUpInterval = setInterval( function() {
      previewUp(true);
    }, 1000/30);
  }
  function stopMoveUp(e) {
    e.preventDefault();
    console.log("btnMoveUp mouse up");
    clearInterval(btnMoveUpInterval);
    previewUp();
  }
  btnMoveUp.mousedown(function(e) { startMoveUp(e) });
  btnMoveUp.mouseup(function(e) { stopMoveUp(e) });
  btnMoveUp.on('touchstart', function(e) { startMoveUp(e) });
  btnMoveUp.on('touchend', function(e) { stopMoveUp(e) });

  function startMoveDown(e) {
    e.preventDefault();
    //      console.log("btnMoveDown mouse down");
    previewDown(true);
    clearInterval(btnMoveDownInterval);
    btnMoveDownInterval = setInterval( function() {
      previewDown(true);
    }, 1000/30);
  }
  function stopMoveDown(e) {
    e.preventDefault();
    console.log("btnMoveDown mouse up");
    clearInterval(btnMoveDownInterval);
    previewDown();
  }
  btnMoveDown.mousedown(function(e) { startMoveDown(e) });
  btnMoveDown.mouseup(function(e) { stopMoveDown(e) });
  btnMoveDown.on('touchstart', function(e) { startMoveDown(e) });
  btnMoveDown.on('touchend', function(e) { stopMoveDown(e) });

  function startTwistLeft(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse down");
    previewTwistLeft(true);
    clearInterval(btnTwistLeftInterval);
    btnTwistLeftInterval = setInterval( function() {
      previewTwistLeft(true);
    }, 1000/30);
  }
  function stopTwistLeft(e) {
    e.preventDefault();
    //      console.log("btnTwistLeft mouse up");
    clearInterval(btnTwistLeftInterval);
    previewTwistLeft();
  }
  btnTwistLeft.mousedown(function(e) { startTwistLeft(e) });
  btnTwistLeft.mouseup(function(e) { stopTwistLeft(e) });
  btnTwistLeft.on('touchstart', function(e) { startTwistLeft(e) });
  btnTwistLeft.on('touchend', function(e) { stopTwistLeft(e) });

  function startTwistRight(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse down");
    previewTwistRight(true);
    clearInterval(btnTwistRightInterval);
    btnTwistRightInterval = setInterval( function() {
      previewTwistRight(true);
    }, 1000/30);
  }
  function stopTwistRight(e) {
    e.preventDefault();
    //      console.log("btnTwistRight mouse up");
    clearInterval(btnTwistRightInterval);
    previewTwistRight();
  }
  btnTwistRight.mousedown(function(e) { startTwistRight(e) });
  btnTwistRight.mouseup(function(e) { stopTwistRight(e) });
  btnTwistRight.on('touchstart', function(e) { startTwistRight(e) });
  btnTwistRight.on('touchend', function(e) { stopTwistRight(e) });

  /*function openSettings() {
    console.log("f:openSettings()");
    $("#contentOverlay").fadeIn(1000, function() {
      loadSettings();
    });
  }*/
  btnSettings.bind('touchstart mousedown',function () {
    //e.preventDefault();
    //console.log("btnSettings clicked");
    settingsWindow.showSettings();
  });
//  btnSettings.on('touchend', function(e) {
//    e.preventDefault();
//    console.log("btnSettings touchend");
//  });

  btnInfo.mouseup(function(e) {
    e.preventDefault();
    console.log("btnInfo mouse up");
  });

  // DEBUG
  /*
  //  $(".agentInfo").css("display", "none");
  btnDebug.click(function(e) {
    console.log("debugClick");
    $(".agentInfo").toggleClass("agentInfoToggle");
    e.preventDefault();
  })
  //*/

  //btnStop.on('touchstart mousedown',stopPrint);
}
function stopPrint() {
  console.log("f:stopPrint() >> sendPrintCommands = " + sendPrintCommands);
  //if (!confirm("Weet je zeker dat je huidige print wilt stoppen?")) return;
  if (sendPrintCommands) printer.stop();
  //setState(Printer.STOPPING_STATE,printer.hasControl);
  printer.overruleState(Printer.STOPPING_STATE);
}


function prevDoodle(e) {
  console.log("f:prevDoodle()");
  console.log("f:prevDoodle()");
}
function nextDoodle(e) {
  console.log("f:nextDoodle()");
}

function print(e) {
	console.log("f:print() >> sendPrintCommands = " + sendPrintCommands);

  //$(".btnPrint").css("display","none");

  if (_points.length > 2) {

  	//setState(Printer.BUFFERING_STATE,printer.hasControl);
    printer.overruleState(Printer.BUFFERING_STATE);
    
    btnStop.css("display","none"); // hack
    
    // we put the gcode generation in a little delay 
    // so that for example the print button is disabled right away
    clearTimeout(gcodeGenerateDelayer);
    gcodeGenerateDelayer = setTimeout(function() { 
    	
    	var gcode = generate_gcode();
    	if (sendPrintCommands) {
    		if(gcode.length > 0) {
    			printer.print(gcode);
    		} else {
    			printer.overruleState(Printer.IDLE_STATE);
    			printer.startStatusCheckInterval();
    		}
			} else {
				console.log("sendPrintCommands is false: not sending print command to 3dprinter");
			}

			if (debugMode) {
				$("#textdump").text("");
				$("#textdump").text(gcode.join("\n"));
			}
			
    }, gcodeGenerateDelay);
  } else {
    console.log("f:print >> not enough points!");
  }

  //alert("Je tekening zal nu geprint worden");
  //$(".btnPrint").css("display","block");


  //	$.post("/doodle3d.of", { data:output }, function(data) {
  //	btnPrint.disabled = false;
  //	});
}


function clearMainView() {
  //    console.log("f:clearMainView()");
  ctx.save();
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.restore();
}
function resetPreview() {
  //    console.log("f:resetPreview()");

  // clear preview canvas
  previewCtx.save();
  previewCtx.clearRect(0,0,canvas.width, canvas.height);
  previewCtx.restore();

  // reset height and rotation to default values
  numLayers 	= previewDefaults.numLayers;     // current number of preview layers
  rStep 			= previewDefaults.rotation; // Math.PI/180; //Math.PI/40; //
}

function oopsUndo() {
  //    console.log("f:oopsUndo()");
  _points.pop();
  redrawDoodle();
  redrawPreview();
}
function previewUp(redrawLess) {
  //    console.log("f:previewUp()");
  if (numLayers < maxNumLayers) {
    numLayers++;
  }
//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewDown(redrawLess) {
  //    console.log("f:previewDown()");
  if (numLayers > minNumLayers) {
    numLayers--;
  }
//  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewTwistLeft(redrawLess) {
  if (redrawLess == undefined) redrawLess = false;
  //    console.log("f:previewTwistLeft()");
  if (rStep > -previewRotationLimit) rStep -= twistIncrement;
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}
function previewTwistRight(redrawLess) {
  //    console.log("f:previewTwistRight()");
  if (rStep < previewRotationLimit) rStep += twistIncrement;
  //  redrawPreview(redrawLess);
  redrawRenderedPreview(redrawLess);
}



function update() {
	setState(printer.state,printer.hasControl);

	thermometer.update(printer.temperature, printer.targetTemperature);
	progressbar.update(printer.currentLine, printer.totalLines);
}

function setState(newState,newHasControl) { 
	if(newState == state && newHasControl == hasControl) return;

	prevState = state;
	
	console.log("setState: ",prevState," > ",newState," ( ",newHasControl,")");
	setDebugText("State: "+newState);

	// print button
	var printEnabled = (newState == Printer.IDLE_STATE && newHasControl);
	if(printEnabled) {
			btnPrint.removeClass("disabled"); // enable print button
			btnPrint.unbind('touchstart mousedown');
			btnPrint.bind('touchstart mousedown',print);
	} else {
			btnPrint.addClass("disabled"); // disable print button
			btnPrint.unbind('touchstart mousedown');
	}

	// stop button
	var stopEnabled = ((newState == Printer.PRINTING_STATE || newState == Printer.BUFFERING_STATE) && newHasControl);
	if(stopEnabled) {
		btnStop.removeClass("disabled");
		btnStop.unbind('touchstart mousedown');
		btnStop.bind('touchstart mousedown',stopPrint);
	} else {
		btnStop.addClass("disabled");
		btnStop.unbind('touchstart mousedown');
	}

	// thermometer
	switch(newState) {
		case Printer.IDLE_STATE:
		case Printer.BUFFERING_STATE:
		case Printer.PRINTING_STATE:
		case Printer.STOPPING_STATE:
			thermometer.show();	
			break;
		default:
			thermometer.hide();	
			break;
	}

	// progress indicator
	switch(newState) {
		case Printer.PRINTING_STATE:
			progressbar.show(); 
			break;
		default:
			progressbar.hide();
			break;
	}
	
	if(newState == Printer.WIFIBOX_DISCONNECTED_STATE) {
		message.set("Lost connection to WiFi box",Message.ERROR);
	}	else if(prevState == Printer.WIFIBOX_DISCONNECTED_STATE) {
		message.set("Connected to WiFi box",Message.INFO,true);
	} else if(newState == Printer.DISCONNECTED_STATE) {
		message.set("Printer disconnected",Message.WARNING,true);
	} else if(prevState == Printer.DISCONNECTED_STATE && newState == Printer.IDLE_STATE || 
						prevState == Printer.UNKNOWN_STATE && newState == Printer.IDLE_STATE) {
		message.set("Printer connected",Message.INFO,true);
	}
	
	state = newState;
	hasControl = newHasControl;
}

/* * * * * * * * * *
 *
 *  VARS
 *
 * * * * * * * * * */
var preview;
var previewCtx;

var svgPathRegExp = /[LM]\d* \d*/ig;
var svgPathParamsRegExp = /([LM])(\d*) (\d*)/;

var dragging = false;

var $canvas, canvas, ctx;
var canvasWidth, canvasHeight;

var drawCanvas;
var drawCanvasTopLeftCoords = [0, 0];

var doodleBounds = [-1, -1, -1, -1]; // left, top, right, bottom
//  var doodleScaleVals = [[0, 0], [1.0, 1.0]]; // [ [x, y], [scaleX, scaleY] ]
var doodleTransform = [0, 0, 1.0, 1.0]; // [ x, y, scaleX, scaleY ]

var _points = [];

var prevCountingTime = 0;
var movementCounter = 0;

var drawVariableLineWeight = false; // set to true to have the momentum of the mouse/touch movement result in larger/smaller strokes
var lineweight = 2;

/* * * * * * * * * *
 *
 *  INIT
 *
 * * * * * * * * * */
function initDoodleDrawing() {
  console.log("f:initDoodleDrawing()");

  $canvas = $("#mycanvas");
  canvas = $canvas[0];
  ctx = canvas.getContext('2d');

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;


  //*
  //TODO make these jquery eventhandlers (works for all)
  if (!canvas.addEventListener) {
    canvas.attachEvent('onmousedown',onCanvasMouseDown);
    canvas.attachEvent('onmousemove',onCanvasMouseMove);
    canvas.attachEvent('onmouseup',onCanvasMouseUp);
    canvas.attachEvent('ontouchstart',onCanvasTouchDown);
    canvas.attachEvent('ontouchmove',onCanvasTouchMove);
    canvas.attachEvent('ontouchend',onCanvasTouchEnd);
    document.body.attachEvent('ontouchmove',prevent);
  } else {
    canvas.addEventListener('mousedown',onCanvasMouseDown,false);
    canvas.addEventListener('mousemove',onCanvasMouseMove,false);
    canvas.addEventListener('mouseup',onCanvasMouseUp,false);
    canvas.addEventListener('touchstart',onCanvasTouchDown,false);
    canvas.addEventListener('touchmove',onCanvasTouchMove,false);
    canvas.addEventListener('touchend',onCanvasTouchEnd,false);
    if (!debugMode) document.body.addEventListener('touchmove',prevent,false);
  }
  //*/

//  drawCanvas = $(".drawareacontainer");
  drawCanvas = $("#mycanvasContainer"); // $("#drawAreaContainer")

  console.log("drawCanvasTopLeftCoords: " + drawCanvasTopLeftCoords);
//  drawCanvasTopLeftCoords[0] = drawCanvas.css("left").match(/[0-9]/g).join("");
//  drawCanvasTopLeftCoords[1] = drawCanvas.css("top").match(/[0-9]/g).join("");
  drawCanvasTopLeftCoords[0] = drawCanvas.offset().left;
  drawCanvasTopLeftCoords[1] = drawCanvas.offset().top;
//  drawCanvasTopLeftCoords[0] = drawCanvas[0].offsetParent.offsetLeft;
//  drawCanvasTopLeftCoords[1] = drawCanvas[0].offsetParent.offsetTop;

  console.log("f:initDoodleDrawing() >> canvasWidth: " + canvasWidth);
  console.log("f:initDoodleDrawing() >> canvasHeight: " + canvasHeight);

}

/* * * * * * * * * *
 *
 *  CANVAS DRAWING FUNCTION
 *
 * * * * * * * * * */
function draw(_x, _y, _width) {
  //    console.log("f:draw() >> _width: " + _width);

  if (prevX == 0 && prevY ==0) {
    prevX = _x;
    prevY = _y;
  }

  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(_x, _y);

  if (_width != undefined) {
    ctx.lineWidth = _width;
  } else {
    if (drawVariableLineWeight) {
      var dist = Math.sqrt(Math.pow((prevX - _x), 2) + Math.pow((prevY - _y), 2));
      if (dist < 10) {
        lineweight += .25;
      } else if (dist < 20) {
        lineweight += .5;
      } else if (dist < 30) {
        lineweight += .75;
      } else if (dist < 50) {
        lineweight += 1;
      } else if (dist < 80) {
        lineweight += 1.5;
      } else if (dist < 120) {
        lineweight += 2.25;
      } else if (dist < 170) {
        lineweight += 3.5;
      } else {
        lineweight += 2;
      }
      lineweight = Math.min(lineweight, 30);
      lineweight *= 0.90;
      lineweight = Math.max(lineweight, 1.0);
    } else {
      lineweight = 2;
    }

    ctx.lineWidth = lineweight;
  }
  ctx.lineCap = 'round';
  ctx.stroke();

  prevX = _x;
  prevY = _y;
}


/* * * * * * * * * *
 *
 *  SUPPORTING FUNCTIONS
 *
 * * * * * * * * * */
function clearDoodle() {
  console.log("f:clearDoodle");

  _points = [];

  prevX = 0;
  prevY = 0;

  updatePrevX = -1;
  updatePrevY = -1;

  doodleBounds = [-1, -1, -1, -1]; // left, top, right, bottom
  doodleTransform = [0, 0, 1.0, 1.0]; // [ x, y, scaleX, scaleY ]

  dragging = false;

  clearMainView();
  resetPreview();
  resetVerticalShapes();
}

function redrawDoodle() {
  console.log("f:redrawDoodle()");

  clearMainView();

  prevX = 0;
  prevY = 0;

  for (var i = 0; i < _points.length; i++) {
    //      console.log("     drawing points " + _points[i]);
    if (_points[i][2] == true) {
      draw(_points[i][0], _points[i][1], 0.5);
    } else {
      draw(_points[i][0], _points[i][1]);
    }
  }
}

 function adjustBounds(x, y) {
  var newPointsOutsideOfCurrentBounds = false;
      console.log("f:adjustBounds("+x+","+y+")");

  if (doodleBounds[0] == -1) {
    // if doodleBounds[0] is -1 then it isn't initted yet, so x and y are both the min and max vals

    doodleBounds[0] = x;
    doodleBounds[1] = y;
    doodleBounds[2] = x;
    doodleBounds[3] = y;
    return;
  }

  if (x < doodleBounds[0]) {
   doodleBounds[0] = x;
   newPointsOutsideOfCurrentBounds = true;
  }
  if (x > doodleBounds[2]) {
   doodleBounds[2] = x;
   newPointsOutsideOfCurrentBounds = true;
  }
 if (y < doodleBounds[1]) {
   doodleBounds[1] = y;
   newPointsOutsideOfCurrentBounds = true;
 }
 if (y > doodleBounds[3]) {
   doodleBounds[3] = y;
   newPointsOutsideOfCurrentBounds = true;
 }
//  doodleBounds[0] = Math.min(doodleBounds[0], x); // left
//  doodleBounds[2] = Math.max(doodleBounds[2], x); // right
//
//  doodleBounds[1] = Math.min(doodleBounds[1], y); // top
//  doodleBounds[3] = Math.max(doodleBounds[3], y); // bottom

  // draw the bounding rect (DEBUG)
  /*
  ctx.beginPath();
  ctx.rect(doodleBounds[0],doodleBounds[1], doodleBounds[2] - doodleBounds[0], doodleBounds[3] - doodleBounds[1]);
  ctx.lineWidth = .2;
  ctx.strokeStyle = "#333"
  ctx.stroke();
  ctx.closePath();
  //*/

  //    console.log("   new bounds: " + doodleBounds);

   return newPointsOutsideOfCurrentBounds;
}

// does what exactly?
function adjustPreviewTransformation() {
  //    console.log("f:adjustPreviewTransformation()");

//  doodleTransform[0] = doodleBounds[0] - (doodleBounds[2] - doodleBounds[0]) / 2;
//  doodleTransform[1] = doodleBounds[1] - (doodleBounds[3] - doodleBounds[1]) / 2;
//  doodleTransform[0] = doodleBounds[0] - ((doodleBounds[2] - doodleBounds[0]) / 2);
//  doodleTransform[1] = doodleBounds[1] - ((doodleBounds[3] - doodleBounds[1]) / 2);
  doodleTransform[0] = doodleBounds[0];
  doodleTransform[1] = doodleBounds[1];

  var sclX, sclY, finalScl;
  if (_points.length < 2) {
//    console.log(_points);
    sclX = 1.0;
    sclY = 1.0;
    finalScl = Math.min(sclX, sclY);
  } else {
    sclX = canvasWidth / (doodleBounds[2] - doodleBounds[0]);
    sclY = canvasHeight / (doodleBounds[3] - doodleBounds[1]);

    // TODO  this shouldn't be a matter if choosing the smallest but should probably involve maintaining aspect ratio??
    finalScl = Math.min(sclX, sclY);
  }

  doodleTransform[2] = finalScl;
  doodleTransform[3] = finalScl;
}


/* * * * * * * * * *
 *
 *  MOUSE/TOUCH EVENTHANDLERS
 *
 * * * * * * * * * */
function onCanvasMouseDown(e) {
  //  console.log("onmousedown >> e.offsetX,e.offsetY = " + e.offsetX+","+e.offsetY);
  //  console.log("onmousedown >> e.layerX,e.layerY= " + e.layerX+","+e.layerY);
  //  console.log("onmousedown >> e: " + e);
  //  console.log(e);
//  console.log("f:onCanvasMouseDown()");
  dragging = true;

  prevCountingTime = new Date().getTime();
  movementCounter = 0

//  _points.push([e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, true]);
//  adjustBounds(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
//  adjustPreviewTransformation();
//  draw(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, 0.5);

  var x, y;
  if (e.offsetX != undefined) {
    x = e.offsetX;
    y = e.offsetY;
  } else {
    x = e.layerX;
    y = e.layerY;
  }
//  console.log("     x: " + x + ", y: " + y);

  _points.push([x, y, true]);
  adjustBounds(x, y);
  adjustPreviewTransformation();
  draw(x, y, 0.5);
}

var prevPoint = {x:-1, y:-1};
function onCanvasMouseMove(e) {
//  console.log("f:onCanvasMouseMove()");
  if (!dragging) return;
  //    console.log("onmousemove");

  var x, y;
  if (e.offsetX != undefined) {
    x = e.offsetX;
    y = e.offsetY;
  } else {
    x = e.layerX;
    y = e.layerY;
  }

  if (prevPoint.x != -1 || prevPoint.y != -1) {
    var dist = Math.sqrt(Math.pow((prevPoint.x - x), 2) + Math.pow((prevPoint.y - y), 2));
    if (dist > 5) { // replace by setting: doodle3d.simplify.minDistance
      _points.push([x, y, false]);
      adjustBounds(x, y)
      adjustPreviewTransformation();
      draw(x, y);
      prevPoint.x = x;
      prevPoint.y = y;
    }
  } else {
    _points.push([x, y, false]);
    adjustBounds(x, y)
    adjustPreviewTransformation();
    draw(x, y);
    prevPoint.x = x;
    prevPoint.y = y;
  }

  // DEBUG
//  $("#textdump").text("");
//  $("#textdump").append("doodlebounds:" + doodleBounds + "\n");
//  $("#textdump").append("doodletransform:" + doodleTransform + "\n");

  if (new Date().getTime() - prevRedrawTime > redrawInterval) {
    // redrawing the whole preview the first X points ensures that the doodleBounds is set well
    prevRedrawTime = new Date().getTime();
    if (_points.length < 50) {
      redrawPreview();
    } else {
      updatePreview(x, y, true);
      /*
       if (_points.length - prevUpdateFullPreview > prevUpdateFullPreviewInterval) {
       console.log("f:onTouchMove >> passed prevUpdateFullPreviewInterval, updating full preview");
       redrawPreview();
       prevUpdateFullPreview = _points.length;
       } else {
       updatePreview(x, y, true);
       }
       //*/
//      redrawPreview();
    }
  }
}
prevUpdateFullPreview = 0; // 0 is not a timeframe but refers to the _points array
prevUpdateFullPreviewInterval = 25; // refers to number of points, not a timeframe

function onCanvasMouseUp(e) {
//  console.log("f:onCanvasMouseUp()");
  //    console.log("onmouseup");
  dragging = false;
  console.log("doodleBounds: " + doodleBounds);
  console.log("doodleTransform: " + doodleTransform);
  //    ctx.stroke();

  console.log("_points.length :" + _points.length);
//  console.log(_points);

  // DEBUG
//  $("#textdump").text("");
//  $("#textdump").append("doodlebounds:" + doodleBounds + "\n");
//  $("#textdump").append("doodletransform:" + doodleTransform + "\n");

//  redrawPreview();
  renderToImageDataPreview();
}

function onCanvasTouchDown(e) {
  e.preventDefault();
  console.log("f:onCanvasTouchDown >> e: " , e);
//  var x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
//  var y = e.touches[0].pageY - e.touches[0].target.offsetTop;
  var x = e.touches[0].pageX - drawCanvasTopLeftCoords[0];
  var y = e.touches[0].pageY - drawCanvasTopLeftCoords[1];
//  var x = e.touches[0].pageX;
//  var y = e.touches[0].pageY;
//  var x = e.touches[0].layerX;
//  var y = e.touches[0].layerY;

  _points.push([x, y, true]);
  adjustBounds(x, y);
  adjustPreviewTransformation();
  draw(x, y, .5);

  movementCounter = 0;

  prevRedrawTime = new Date().getTime();
}

function onCanvasTouchMove(e) {
  e.preventDefault();
//  var x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
//  var y = e.touches[0].pageY - e.touches[0].target.offsetTop;
    var x = e.touches[0].pageX - drawCanvasTopLeftCoords[0];
    var y = e.touches[0].pageY - drawCanvasTopLeftCoords[1];
//    var x = e.touches[0].layerX;
//    var y = e.touches[0].layerY;
//  var x = e.touches[0].layerX;
//  var y = e.touches[0].layerY;

  console.log("f:onCanvasTouchMove >> x,y = "+x+","+y+" , e: " , e);

  if (prevPoint.x != -1 || prevPoint.y != -1) {
    var dist = Math.sqrt(Math.pow((prevPoint.x - x), 2) + Math.pow((prevPoint.y - y), 2));
    if (dist > 5) {
      _points.push([x, y, false]);
      adjustBounds(x, y)
      adjustPreviewTransformation();
      draw(x, y);
      prevPoint.x = x;
      prevPoint.y = y;
    }
  } else {
    _points.push([x, y, false]);
    adjustBounds(x, y)
    adjustPreviewTransformation();
    draw(x, y);
    prevPoint.x = x;
    prevPoint.y = y;
  }

  // update counter -> this was for getting a handle on how often the Canvas fires a move-event
  /*
   movementCounter++;
   if (new Date().getTime() - prevCountingTime > 1000) {
   //      console.log("number of moves in 1sec: " + movementCounter)
   prevCountingTime= new Date().getTime();
   $("#numtimes").text(movementCounter + " times");
   movementCounter = 0;
   }
   //*/

  if (new Date().getTime() - prevRedrawTime > redrawInterval) {
    // redrawing the whole preview the first X points ensures that the doodleBounds is set well
    if (_points.length < 50) {
      redrawPreview();
    } else {
      updatePreview(x, y, true);
      /*
      if (_points.length - prevUpdateFullPreview > prevUpdateFullPreviewInterval) {
        console.log("f:onTouchMove >> passed prevUpdateFullPreviewInterval, updating full preview");
        redrawPreview();
        prevUpdateFullPreview = _points.length;
      } else {
        updatePreview(x, y, true);
      }
      //*/
    }
    prevRedrawTime = new Date().getTime();
  }
}

function onCanvasTouchEnd(e) {
  console.log("f:onCanvasTouchEnd()");
  console.log("doodleBounds: " + doodleBounds);
  console.log("doodleTransform: " + doodleTransform);
  //    ctx.stroke();

  console.log("_points.length :" + _points.length);

  //  redrawPreview();
  renderToImageDataPreview();
}

function prevent(e) {
  e.preventDefault();
}
//*
var $preview;
var preview;
var previewCtx;

var preview_tmp;
var previewCtx_tmp;

var previewDefaults = {
  rotation: Math.PI/90,
  numLayers: 10
}

var svgPathRegExp = /[LM]\d* \d*/ig;
var svgPathParamsRegExp = /([LM])(\d*) (\d*)/;

var prevRedrawTime = new Date().getTime();
var redrawInterval = 1000 / 30; // ms

function initPreviewRendering() {
  console.log("f:initPreviewRendering()");

  $preview = $("#preview");
  preview = $preview[0];
  previewCtx = preview.getContext('2d');

  // DEBUG --> mbt preview_tmp (voor de toImageData truc)
  var _ratio  = preview.width / canvas.width;
  preview_tmp = document.getElementById('preview_tmp');
  preview_tmp.width = preview.width;
  preview_tmp.height = canvas.height * _ratio;
  $("#preview_tmp").css("top", -preview_tmp.height);

  previewCtx_tmp = preview_tmp.getContext('2d');

  calcPreviewCanvasProperties();
  redrawPreview();
}

function calcPreviewCanvasProperties() {
  console.log("f:calcPreviewCanvasProperties()");

  globalScale = preview.width / canvasWidth;
  layerCX			= (canvasWidth / 2) * globalScale;  // defined in canvasDrawing_v01.js
  layerCY			= (canvasHeight / 2) * globalScale; // defined in canvasDrawing_v01.js
//  layerOffsetY = preview.height - 1.75 * layerCY;
  layerOffsetY = preview.height * (1 - previewVerticalPadding.bottom);
  yStep 			= (preview.height - (preview.height * (previewVerticalPadding.top + previewVerticalPadding.bottom))) / maxNumLayers;
}

// TODO (perhaps) : make the twist limit dynamic, depending on what's printable (w.r.t. overlapping)
var previewRotationLimit = Math.PI / 30; // rough estimate

var numLayers 	= previewDefaults.numLayers;     // current number of preview layers
var maxNumLayers= 100;    // maximum number of preview layers
var minNumLayers= 2;      // minimum number of preview layers
var globalScale = 0.3;		// global scale of preview (width preview / width canvas)
var globalAlpha = 0.20;   // global alpha of preview
var scaleY 			= 0.4; 		// additional vertical scale per path for 3d effect
var viewerScale = 0.65;   // additional scale to fit into preview nicely (otherwise is fills out totally)
var previewVerticalPadding = { "top" : .15, "bottom" : 0.12 }; // %
var strokeWidth = 2;      //4;
//var rStep 			= Math.PI/40; //Math.PI/40; //
var rStep 			= previewDefaults.rotation; // Math.PI/180; //Math.PI/40; //
var yStep;// 			= preview.height / 150; // 3; //6;
//var svgWidth 		= 500; // 650 //parseInt($(svg).css("width"));
//var svgHeight 	= 450; //450; //parseInt($(svg).css("height"));
var layerCX, layerCY;
//var layerCX			= (canvasWidth / 2) * globalScale;  // defined in canvasDrawing_v01.js
//var layerCY			= (canvasHeight / 2) * globalScale; // defined in canvasDrawing_v01.js
var layerOffsetY; //= preview.height - 1.75 * layerCY; // 330; // previewHeight - 120
var prevX 			= 0;
var prevY 			= 0;
var highlight		= true; //highlight bottom, middle and top layers

var linesRaw = "";
var debug_redrawSimplification = 6;
function redrawPreview(redrawLess) {
  if (redrawLess == undefined) redrawLess = false;

  if (_points.length < 2) return;

  if (!redrawLess) {
    //debug_redrawSimplification = Math.round(_points.length / 65);
    //*
    if (_points.length < 100) {
      debug_redrawSimplification = 6;
    } else if (_points.length < 250) {
      debug_redrawSimplification = 7;
    } else if (_points.length < 400) {
      debug_redrawSimplification = 8;
    } else if (_points.length < 550) {
      debug_redrawSimplification = 9;
    } else if (_points.length < 700) {
      debug_redrawSimplification = 10;
    } else {
      debug_redrawSimplification = 11;
    }
    //*/
//    console.log("debug_redrawSimplification: " + debug_redrawSimplification);
  }

  var y = 0;
  var r = 0;

  //preview.width = preview.width;
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.lineWidth = strokeWidth;
  previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  for(var i = 0; i < numLayers; i++) {

    var verticalScaleFactor = scaleFunction(i / maxNumLayers);

    if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) {
      previewCtx.globalAlpha = 1;
    } else {
      previewCtx.globalAlpha = globalAlpha;
    }

    if (redrawLess && i%debug_redrawSimplification != 0 && !(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) ) {
      y -= yStep;
      r += rStep;
      continue;
    }

    previewCtx.save();

//    previewCtx.translate(layerCX, layerOffsetY + layerCY + y);
    previewCtx.translate(layerCX, layerOffsetY + y);
//    previewCtx.setTransform(1, 0, 0, scaleY, layerCX, layerOffsetY+layerCY+y);
    previewCtx.scale(viewerScale * verticalScaleFactor, scaleY * viewerScale * verticalScaleFactor);
    previewCtx.rotate(r);
    previewCtx.translate((-doodleTransform[0]) * (globalScale * doodleTransform[2]), (-doodleTransform[1]) * (globalScale * doodleTransform[3]));

    var adjustedDoodlePoint = centeredAndScaledDoodlePoint(_points[0]);

    previewCtx.beginPath();
    previewCtx.moveTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    for(var j = 1; j < _points.length; j++) {
      adjustedDoodlePoint = centeredAndScaledDoodlePoint(_points[j])
      if (redrawLess && j%debug_redrawSimplification != 0 ) continue;
      previewCtx.lineTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    }
    previewCtx.stroke();

    y -= yStep;
    r += rStep;
    previewCtx.restore();
  }
  previewCtx.globalAlpha = globalAlpha;
}

function renderToImageDataPreview() {
  console.log("f:renderToImageDataPreview()");

  if (_points.length < 2) return;

  //*
  // the first step
  previewCtx_tmp.clearRect(0, 0, preview.width, preview.height);
  previewCtx_tmp.lineWidth = strokeWidth;
  previewCtx_tmp.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  previewCtx_tmp.save();
  previewCtx_tmp.translate(layerCX, layerCY);
  previewCtx_tmp.scale(viewerScale, viewerScale);
  previewCtx_tmp.translate((-doodleTransform[0]) * (globalScale * doodleTransform[2]), (-doodleTransform[1]) * (globalScale * doodleTransform[3]));

  var adjustedDoodlePt = centeredAndScaledDoodlePoint(_points[0]);

  previewCtx_tmp.beginPath();
  previewCtx_tmp.moveTo(adjustedDoodlePt.x, adjustedDoodlePt.y);
  for(var j = 1; j < _points.length; j++) {
    adjustedDoodlePt = centeredAndScaledDoodlePoint(_points[j])
    previewCtx_tmp.lineTo(adjustedDoodlePt.x, adjustedDoodlePt.y);
  }
  previewCtx_tmp.stroke();
  previewCtx_tmp.closePath();
  previewCtx_tmp.restore();
  //*/

  //  var saved_rect = previewCtx_tmp.getImageData(0, 0, layerCX*2, layerCY*2);
  var saved_rect_todataurl = preview_tmp.toDataURL();
  doodleImageCapture = new Image();
  doodleImageCapture.onload = function() {

    previewCtx.clearRect(0, 0, preview.width, preview.height);
    previewCtx.lineWidth = strokeWidth;
    previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

    var y = 0;
    var r = 0;

    for(var i=0;i<numLayers;i++) {

      var verticalScaleFactor = scaleFunction(i / maxNumLayers);

      if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1){
        previewCtx.globalAlpha = 1;
      } else {
        previewCtx.globalAlpha = globalAlpha;
      }

      previewCtx.save();

      previewCtx.translate(layerCX,layerOffsetY+y);
//      previewCtx.scale(1, scaleY)
      previewCtx.scale(verticalScaleFactor, scaleY * verticalScaleFactor)
      previewCtx.rotate(r);
      previewCtx.translate(-layerCX,-layerCY);

      previewCtx.drawImage(doodleImageCapture, 0, 0);

      y -= yStep;
      r += rStep;
      previewCtx.restore();
    }
  };
  doodleImageCapture.src = saved_rect_todataurl;

  previewCtx.globalAlpha = globalAlpha;
}

// called by the move up/down or twist left/right buttons
// it is assumed that the preview has been rendered to an Image object, which will be used to draw the preview with (much better performance)
function redrawRenderedPreview(redrawLess) {
  if (redrawLess == undefined) redrawLess = false;
  console.log("f:redrawRenderedPreview()");

  previewCtx.clearRect(0, 0, preview.width, preview.height);
  previewCtx.lineWidth = strokeWidth;
  previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  var y = 0;
  var r = 0;

  for(var i = 0; i < numLayers; i++) {

    var verticalScaleFactor = scaleFunction(i / maxNumLayers);

    if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1){
      previewCtx.globalAlpha = 1;
    } else {
      previewCtx.globalAlpha = globalAlpha;
    }

    if (redrawLess && i%2 != 0 && !(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) ) {
      y -= yStep;
      r += rStep;
      continue;
    }
    previewCtx.save();

    previewCtx.translate(layerCX,layerOffsetY+y);
//    previewCtx.scale(1, scaleY)
    previewCtx.scale(verticalScaleFactor, scaleY * verticalScaleFactor);
    previewCtx.rotate(r);
    previewCtx.translate(-layerCX,-layerCY);

    previewCtx.drawImage(doodleImageCapture, 0, 0);

    y -= yStep;
    r += rStep;
    previewCtx.restore();
  }
}

function centeredAndScaledDoodlePoint(p) {
  var obj = { x: 0, y: 0};

  obj.x = (p[0] - ((doodleBounds[2] - doodleBounds[0])/2)) * (globalScale * doodleTransform[2]);
  obj.y = (p[1] - ((doodleBounds[3] - doodleBounds[1])/2)) * (globalScale * doodleTransform[3]);
//  obj.x = (p[0] - (doodleBounds[2] - doodleBounds[0])) * (globalScale * doodleTransform[2]);
//  obj.y = (p[1] - (doodleBounds[3] - doodleBounds[1])) * (globalScale * doodleTransform[3]);
//  obj.x = (p[0] - doodleTransform[0]) * (globalScale * doodleTransform[2]);
//  obj.y = (p[1] - doodleTransform[1]) * (globalScale * doodleTransform[3]);

  return obj;
}

//*
var updatePrevX = -1;
var updatePrevY = -1;
function updatePreview(_x, _y, redrawLess) {
  if (redrawLess == undefined) redrawLess = false;
  redrawLess = false;

  if (_points.length < 2) return;
  if (updatePrevX == -1 || updatePrevY == -1) {
    updatePrevX = _x;
    updatePrevY = _y;
    return;
  }

//  if (_points.length < 16 && Math.sqrt(Math.pow((updatePrevX - _x), 2) + Math.pow((updatePrevY - _y), 2)) < 8) return;

  var y = 0;
  var r = 0;

  previewCtx.lineWidth = strokeWidth;
  previewCtx.strokeStyle = '#f00'; //"rgba(255,255,0,0)";

  for(var i = 0; i < numLayers; i++) {

    if(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) {
      previewCtx.globalAlpha = 1;
    } else {
      previewCtx.globalAlpha = globalAlpha;
    }

    if (redrawLess && i%debug_redrawSimplification != 0 && !(i == 0 || i == Math.floor(numLayers/2) || i == numLayers-1) ) {
      y -= yStep;
      r += rStep;
      continue;
    }

    previewCtx.save();

//    previewCtx.translate(layerCX, layerOffsetY + layerCY + y);
    previewCtx.translate(layerCX, layerOffsetY + y);
    previewCtx.scale(viewerScale, scaleY * viewerScale);
    previewCtx.rotate(r);
    previewCtx.translate((-doodleTransform[0]) * (globalScale * doodleTransform[2]), (-doodleTransform[1]) * (globalScale * doodleTransform[3]));


    previewCtx.beginPath();
    var prevPoint = centeredAndScaledDoodlePoint([updatePrevX, updatePrevY]);
    previewCtx.moveTo(prevPoint.x, prevPoint.y);
    var adjustedDoodlePoint = centeredAndScaledDoodlePoint([_x, _y]);
    previewCtx.lineTo(adjustedDoodlePoint.x, adjustedDoodlePoint.y);
    previewCtx.stroke();

    y -= yStep;
    r += rStep;
    previewCtx.restore();
  }
  previewCtx.globalAlpha = globalAlpha;
  updatePrevX = _x;
  updatePrevY = _y;

}
//*/
/*var gcodeStart = [];
gcodeStart.push(";Generated with Doodle3D");
gcodeStart.push("G21"); 						// metric values
gcodeStart.push("G91"); 						// relative positioning
gcodeStart.push("M107"); 						// start with the fan off
gcodeStart.push("G28 X0 Y0"); 			// move X/Y to min endstops
gcodeStart.push("G28 Z0"); 					// move Z to min endstops
gcodeStart.push("G1 Z15 F9000"); 		// move the platform down 15mm
gcodeStart.push("G92 E0"); 					// zero the extruded length
gcodeStart.push("G1 F200 E10");			// extrude 10mm of feed stock
gcodeStart.push("G92 E0");					// zero the extruded length again
//gcodeStart.push("G92 X-100 Y-100 E0"); // zero the extruded length again and make center the start position
gcodeStart.push("G1 F9000");
gcodeStart.push("G90"); 						// absolute positioning
gcodeStart.push("M117 Printing Doodle...  ");	// display message (20 characters to clear whole screen)

var gcodeEnd= [];
gcodeEnd.push("M107"); 							// fan off
gcodeEnd.push("G91"); 							// relative positioning
gcodeEnd.push("G1 E-1 F300"); 			// retract the filament a bit before lifting the nozzle, to release some of the pressure
gcodeEnd.push("G1 Z+0.5 E-5 X-20 Y-20 F9000"); // move Z up a bit and retract filament even more
gcodeEnd.push("G28 X0 Y0"); 				// move X/Y to min endstops, so the head is out of the way
gcodeEnd.push("M84"); 							// disable axes / steppers
gcodeEnd.push("G90"); 							// absolute positioning
gcodeEnd.push("M117 Done                ");	// display message (20 characters to clear whole screen)*/


var MAX_POINTS_TO_PRINT = 400000; //80000; //40000; 
var gcode = [];

function generate_gcode() {
  console.log("f:generategcode()");

  // TODO 2013-09-18 evaluate if this should stay here
  // this was added when Rick mailed us wrt the Ultimaker delivery of Doodle3D
  var gCodeOffsetX = 110; // mm
  var gCodeOffsetY = 110; // mm
  
  gcode = [];

  console.log("settings: ",settings);
  var speed 						      = settings["printer.speed"]
  var normalSpeed 			      = speed;
  var bottomSpeed 			      = speed*0.5;
  var travelSpeed 			      = settings["printer.travelSpeed"]
  var filamentThickness       = settings["printer.filamentThickness"];
  var wallThickness 		      = settings["printer.wallThickness"];
  var screenToMillimeterScale = settings["printer.screenToMillimeterScale"];
  var layerHeight 			      = settings["printer.layerHeight"];
  var maxObjectHeight		      = settings["printer.maxObjectHeight"];
  var temperature 			      = settings["printer.temperature"];
  var bedTemperature 			    = settings["printer.bed.temperature"];
  var useSubLayers 			      = settings["printer.useSubLayers"];
  var enableTraveling 	      = settings["printer.enableTraveling"];
  var retractionEnabled 	    = settings["printer.retraction.enabled"];
  var retractionspeed 	      = settings["printer.retraction.speed"];
  var retractionminDistance   = settings["printer.retraction.minDistance"];
  var retractionamount 	      = settings["printer.retraction.amount"];
  var preheatTemperature      = settings["printer.heatup.temperature"];
  var preheatBedTemperature   = settings["printer.heatup.bed.temperature"];
  
  var startGcode = settings["printer.startgcode"];
  startGcode = subsituteVariables(startGcode,temperature,bedTemperature,preheatTemperature,preheatBedTemperature);
	startGcode = startGcode.split("\n");
	
	var endGcode = settings["printer.endgcode"];
	endGcode = subsituteVariables(endGcode,temperature,bedTemperature,preheatTemperature,preheatBedTemperature);
	endGcode = endGcode.split("\n");
	
  /*
  console.log("f:generate_gcode >> EFFE CHECKEN:");
  console.log("   speed: " + speed);
  console.log("   travelSpeed: " + travelSpeed);
  console.log("   filamentThickness: " + filamentThickness);
  console.log("   wallThickness: " + wallThickness);
  console.log("   screenToMillimeterScale: " + screenToMillimeterScale);
  console.log("   layerHeight: " + layerHeight);
  console.log("   objectHeight: " + objectHeight);
  console.log("   maxObjectHeight: " + maxObjectHeight);
  console.log("   temperature: " + temperature);
  console.log("   maxObjectHeight: " + maxObjectHeight);
  console.log("   useSubLayers: " + useSubLayers);
  console.log("   enableTraveling: " + enableTraveling);
  console.log("   retractionspeed: " + retractionspeed);
  console.log("   retractionminDistance: " + retractionminDistance);
  console.log("   retractionamount: " + retractionamount);
  console.log("");
  //*/

  // max amount of real world layers
  var layers = maxObjectHeight / layerHeight; //maxObjectHeight instead of objectHeight

  // translate numLayers in preview to objectHeight in real world
  //objectHeight = Math.ceil(numLayers / 5); // in settings objectHeight = 20, in previewRendering_v01.js numLayers is 100, hence the / 5
  //objectHeight = numLayers; // in settings objectHeight = 20, in previewRendering_v01.js numLayers is 100, hence the / 5
  objectHeight = Math.round(numLayers/maxNumLayers*maxObjectHeight);

  // translate preview rotation (per layer) to real world rotation
  var rStepGCode = rStep * maxNumLayers/layers; ///maxNumLayers*maxObjectHeight;
  // correct direction
  rStepGCode = -rStepGCode;

  // todo hier een array van PATHS maken wat de losse paths zijn

  // copy array without reference -> http://stackoverflow.com/questions/9885821/copying-of-an-array-of-objects-to-another-array-without-object-reference-in-java
  var points = JSON.parse(JSON.stringify(_points));

//  console.log("f:generategcode() >> paths: " + paths.toString());
//  console.log("paths.toString(): " + paths.toString());
//  return;
  
  //gcode.push("M104 S" + temperature); // set target temperature and do not wait for the extruder to reach it
  //gcode.push("M109 S" + temperature); // set target temperature and wait for the extruder to reach it
  
  // add gcode begin commands
  gcode = gcode.concat(startGcode);
  
  //gcode.push("M109 S" + temperature); // set target temperature and wait for the extruder to reach it

  var layers = maxObjectHeight / layerHeight; //maxObjectHeight instead of objectHeight
  var extruder = 0.0;
  var prev = new Point(); prev.set(0, 0);

  // replacement (and improvement) for ofxGetCenterofMass
  var centerOfDoodle = {
    x: doodleBounds[0] + (doodleBounds[2]- doodleBounds[0])/2,
    y: doodleBounds[1] + (doodleBounds[3] - doodleBounds[1])/2
//    x: doodleBounds[0],
//    y: doodleBounds[1]
  }

  console.log("f:generategcode() >> layers: " + layers);
  if (layers == Infinity) return;

	// check feasibility of design
	var pointsToPrint = points.length * layers*(objectHeight/maxObjectHeight)
	//console.log("  points.length: ",points.length);
	//console.log("  numLayers: ",(layers*(objectHeight/maxObjectHeight)));
	//console.log("  pointsToPrint: ",pointsToPrint);
	//console.log("  MAX_POINTS_TO_PRINT: ",MAX_POINTS_TO_PRINT);
  
  if(pointsToPrint > MAX_POINTS_TO_PRINT) {
  	alert("Sorry, your doodle to to complex and / or to high");
  	console.log("WARNING: to many points to convert to gcode");
  	return [];
  }
	
  for (var layer = 0; layer < layers; layer++) {

    var p = JSON.parse(JSON.stringify(points)); // [].concat(points);

    if (p.length < 2) return;
    var even = (layer % 2 == 0);
    var progress = layer / layers;

    // float layerScale = scaleFunction(float(layer)/layers); // scaleFactor van de layer -> lookup naar vfunc[] voor die scaleVals
//    var layerScale = 1.0;
    var layerScale = scaleFunction(progress);

    // if begin point this row and end point last row are close enough, isLoop is true
    var isLoop = lineLength(points[0][0], points[0][1], points[points.length-1][0], points[points.length-1][1]) < 3;

    // set center of doodle as middle (ie subtract to that)
    pointsTranslate(p, -centerOfDoodle.x, -centerOfDoodle.y);
    pointsScale(p, screenToMillimeterScale,-screenToMillimeterScale);
    pointsScale(p, layerScale, layerScale);

    // sort-of in de buurt van (360/2.5)
    // // -> aight.. er zijn 750 lines vs 1000 in de d3d app. 135 = .75 * 180... dit kan je nog rechttrekken als je NET wat slimmer nadenkt :)
    // update: NEE, het is niet .75 * 180 want 135 was niet de beste value.
    //pointsRotate(p, rStep * progress * 139);
    pointsRotate(p, rStepGCode * layer);

    if (layer == 0) {
      //gcode.push("M107"); //fan off
      if (firstLayerSlow) {
	      //gcode.push("M220 S20"); //slow speed
	      speed = bottomSpeed;
			  //console.log("> speed: ",speed);
      }
    } else if (layer == 2) { ////////LET OP, pas bij layer 2 weer op normale snelheid ipv layer 1
      gcode.push("M106");      //fan on
      //gcode.push("M220 S100"); //normal speed
      speed = normalSpeed;
  	  //console.log("> speed: ",speed);
    }

    var curLayerCommand = 0;
    var totalLayerCommands = p.length;
    var layerProgress = 0;

    var paths = [];
    var pathCounter = -1;
    //  var points = [];

    for (var i = 0; i < p.length; i++) {
      if (p[i][2] == true) {
        pathCounter++;
        paths.push([]);
        paths[pathCounter].push([p[i][0], p[i][1]]);
      } else {
        paths[pathCounter].push([p[i][0], p[i][1]]);
      }
    }
//    console.log("f:generategcode() >> paths.length: " + paths.length);

    // loop over the subpaths (the separately drawn lines)
    for (var j = 0; j < paths.length; j++) { // TODO paths > subpaths
      // this line is probably for drawing efficiency, alternating going from 0->end and end->0 (i.e. to and fro)
//      vector<ofSubPath::Command> &commands = subpaths[even ? j : subpaths.size()-1-j].getCommands();
      var commands = paths[j]; //commands zijn alle points uit subpath j // TODO commands > subpathPoints

      // loop over the coordinates of the subpath
      for (var i = 0; i < commands.length; i++) {
        var last = commands.length - 1;

        // this line is probably for drawing efficiency, alternating going from 0->end and end->0 (i.e. to and fro)
//        ofPoint to = commands[(even || isLoop || loopAlways) ? i : last-i].to;
        var to = new Point(); to.set(commands[i][0], commands[i][1]);

        // TODO 2013-09-18 evaluate if this should stay..
        // this was added when Rick mailed us wrt the Ultimaker delivery of Doodle3D
        to.x += gCodeOffsetX;
        to.y += gCodeOffsetY;

        var sublayer = (layer == 0) ? 0.0 : layer + (useSubLayers ? (curLayerCommand/totalLayerCommands) : 0);
        var z = (sublayer + 1) * layerHeight; // 2013-09-06 removed zOffset (seemed to be useless)

        var isTraveling = !isLoop && i==0;
        var doRetract = retractionEnabled && prev.distance(to) > retractionminDistance;

        if (enableTraveling && isTraveling) {
//          console.log("enableTraveling && isTraveling >> doRetract: " + doRetract + ", retractionspeed: " + retractionspeed);
          if (doRetract) gcode.push("G0 E" + (extruder - retractionamount).toFixed(3) + " F" + (retractionspeed * 60).toFixed(3)); //retract
          gcode.push("G0 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + z.toFixed(3) + " F" + (travelSpeed * 60).toFixed(3));
          if (doRetract) gcode.push("G0 E" + extruder.toFixed(3) + " F" + (retractionspeed * 60).toFixed(3)); // return to normal
        } else {
//          console.log("       else");
          //extruder += prev.distance(to) * wallThickness * layerHeight / filamentThickness;
          extruder += prev.distance(to) * wallThickness * layerHeight / (Math.pow((filamentThickness/2), 2) * Math.PI);
          gcode.push("G1 X" + to.x.toFixed(3) + " Y" + to.y.toFixed(3) + " Z" + z.toFixed(3) + " F" + (speed * 60).toFixed(3) + " E" + extruder.toFixed(3));
        }

        curLayerCommand++;
        layerProgress = curLayerCommand/totalLayerCommands;
        prev = to;

      }

    }

    if ((layer/layers) > (objectHeight/maxObjectHeight)) {
      console.log("f:generategcode() >> (layer/layers) > (objectHeight/maxObjectHeight) is true -> breaking at layer " + (layer + 1));
      break;
    }
  }
  // add gcode end commands
  gcode = gcode.concat(endGcode);
  
  return gcode;
}

function subsituteVariables(gcode,temperature,bedTemperature,preheatTemperature,preheatBedTemperature) {
	
	gcode = gcode.replace(/{printingTemp}/gi  	,temperature);
	gcode = gcode.replace(/{printingBedTemp}/gi ,bedTemperature);
	gcode = gcode.replace(/{preheatTemp}/gi			,preheatTemperature);
	gcode = gcode.replace(/{preheatBedTemp}/gi 	,preheatBedTemperature);
	
	return gcode;
}

function scaleFunction(percent) {
  var r = 1.0;

  switch (VERTICALSHAPE) {
    case verticalShapes.NONE:
      r = 1.0;
      break;
    case verticalShapes.DIVERGING:
      r = .5 + (percent * .5);
      break;
    case verticalShapes.CONVERGING:
      r = 1.0 - (percent * .8);
      break;
    case verticalShapes.SINUS:
      r = (Math.cos(percent * Math.PI * 4) * .25) + .75;
      break;
  }

//  return 1.0 - (percent *.8);
  return r;
}

pointsTranslate = function(p, x, y) {
  for (var i = 0; i < p.length; i++) {
    p[i][0] += x;
    p[i][1] += y;
  }
}

pointsScale = function(p, sx, sy) {
  for (var i = 0; i < p.length; i++) {
    p[i][0] *= sx;
    p[i][1] *= sy;
  }
}

// rotates around point 0,0 (origin).
// Not the prettiest kind of rotation solution but in our case we're assuming that the points have just been translated to origin
pointsRotate = function(p, ang) {
  var _ang, dist;
  for (var i = 0; i < p.length; i++) {
    dist = Math.sqrt(p[i][0] * p[i][0] + p[i][1] * p[i][1]);
    _ang = Math.atan2(p[i][1], p[i][0]);
    p[i][0] = Math.cos(_ang + ang) * dist;
    p[i][1] = Math.sin(_ang + ang) * dist;
  }
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/line-length [rev. #1]
lineLength = function(x, y, x0, y0){
  return Math.sqrt((x -= x0) * x + (y -= y0) * y);
};

var Point = function() {};
Point.prototype = {
  x: 0,
  y: 0,
  set: function(_x, _y) {
    this.x = _x;
    this.y = _y;
  },
  distance: function(p) {
    var d = -1;
    if (p instanceof Point) {
      d = Math.sqrt((p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y));
    }
    return d;
  },
  toString: function() {
    console.log("x:" + this.x + ", y:" + this.y);
  }
}

// TODO refactor this stuff, there's much to wipe
var drawAreaContainerMinHeight = 300;
var drawAreaContainerMaxHeight = 450;

function doOnResize() {
  //    console.log("doOnResize() >> " + new Date().getTime());
  canvas.width = $canvas.width();
  canvas.height = $canvas.height(); // canvas.clientHeight;

  preview.width = $preview.width();
  preview.height = $drawAreaContainer.height();

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

  console.log("   preview.width: " + preview.width + ", $preview.width(): " + $preview.width());

  calcPreviewCanvasProperties();

  drawCanvasTopLeftCoords[0] = drawCanvas.offset().left;
  drawCanvasTopLeftCoords[1] = drawCanvas.offset().top;

  redrawDoodle();
  redrawPreview();

}

function initLayouting() {
  console.log("f:initLayouting()");

  $drawAreaContainer = $(".drawareacontainer");

  canvas.width = $canvas.width();
  canvas.height = $canvas.height(); // canvas.clientHeight;

  preview.width = $preview.width();
  preview.height = $drawAreaContainer.height();

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

  $drawAreaContainer.show();

  // window.innerHeight
  console.log("window.innerHeight: " + window.innerHeight);
  console.log("window.innerWidth: " + window.innerWidth);
  console.log("$drawAreaContainer.innerHeight(): " + $drawAreaContainer.innerHeight());
  console.log("$drawAreaContainer.offset().top: " + $drawAreaContainer.offset().top);

  // timeout because it SEEMS to be beneficial for initting the layout
  // 2013-09-18 seems beneficial since when?
  setTimeout(_startOrientationAndChangeEventListening, 1000);
}

function _startOrientationAndChangeEventListening() {
  // Initial execution if needed

  $(window).on('resize', doOnResize);

  // is it necessary to call these? Aren't they called by the above eventhandlers?
  doOnResize();
}

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
	
	Printer.WIFIBOX_DISCONNECTED_STATE 	= "wifibox disconnected";
	Printer.UNKNOWN_STATE 							= "unknown";				// happens when a printer is connection but there isn't communication yet
	Printer.DISCONNECTED_STATE 					= "disconnected";		// printer disconnected
	Printer.IDLE_STATE 									= "idle"; 					// printer found, but idle
	Printer.BUFFERING_STATE 						= "buffering";			// printer is buffering (recieving) data, but not yet printing
	Printer.PRINTING_STATE 							= "printing";
	Printer.STOPPING_STATE 							= "stopping";				// when you stop (abort) a print it prints the endcode

	Printer.ON_BEFORE_UNLOAD_MESSAGE = "You're doodle is still being send to the printer, leaving will result in a incomplete 3D print";
	
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
    	this.startStatusCheckInterval();
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
    
    message.set("Sending doodle to printer...",Message.NOTICE);
    self.addLeaveWarning();
		
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
		          btnStop.css("display","block"); // hack
		          self.removeLeaveWarning();
		          message.set("Doodle is send to printer...",Message.INFO,true);
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
			  	// after we know the first gcode packed has bin received or failed
					// (and the driver had time to update the printer.state) 
					// we start checking the status again
					if(sendIndex == 0) {
						self.startStatusCheckInterval();
					}
				}
			}).fail(function() { 
				console.log("Printer:sendPrintPart: failed");
				clearTimeout(self.retrySendPrintPartDelay);
				self.retrySendPrintPartDelay = setTimeout(function() {
					console.log("request printer:sendPrintPart failed retry");
					self.sendPrintPart(sendIndex, sendLength) 
				},self.retryDelay); // retry after delay
				
				// after we know the gcode packed has bin received or failed
				// (and the driver had time to update the printer.state) 
				// we start checking the status again
				self.startStatusCheckInterval();
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
      console.log ("Printer >> f:communicateWithWifibox() >> communicateWithWifibox is false, so not executing this function");
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
		console.log("Printer:checkStatus");
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
		console.log("Printer:handleStatusUpdate response: ",response);
		var data = response.data;
		if(response.status != "success") {
			self.state = Printer.UNKNOWN_STATE;
		} else {
			// state
			//console.log("  stateOverruled: ",this.stateOverruled);
			if(!this.stateOverruled) {
				self.state 								= data.state;
				//console.log("  state > ",self.state);
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
		
		this.stopStatusCheckInterval();
	}
	
	this.removeLeaveWarning = function() {
		window.onbeforeunload = null;
	}
	this.addLeaveWarning = function() {
		window.onbeforeunload = function() {
				return Printer.ON_BEFORE_UNLOAD_MESSAGE;
		};
	}
}
function Progressbar() {
  this.currProgress = 0; // default val

  this.progressbarFGImg = new Image();
  this.progressbarFGImgSrc = "img/progress_fg.png";
  this.progressbarBGImg = new Image();
  this.progressbarBGImgSrc = "img/progress_bg.png";

  this.progressWidth= 93;
  this.progressHeight = 82;

  this.quartPI = .5 * Math.PI;
  this.twoPI = 2 * Math.PI;


  this.$canvas;
  this.canvas;
  this.context;
  this.$container;

  this.isInitted = false;

  this.enabled = true;

  this.init = function(targCanvas, targCanvasContainer) {
    console.log("Thermometer.init()");

    this.$container = targCanvasContainer;

    this.$canvas = targCanvas;
    this.canvas = this.$canvas[0];
    this.context = this.canvas.getContext('2d');


    var self = this;
    this.progressbarBGImg.onload = function() {
      console.log("progressbarBGImg img loaded");
      //        self.isInitted = true;
      //        self.update(self.currentTemperature, self.targetTemperature);

      self.progressbarFGImg.onload = function() {
        console.log("progressbarFGImg img loaded");
        self.isInitted = true;
        self.update(0, 100);
      };
      self.progressbarFGImg.src = self.progressbarFGImgSrc;
    };
    this.progressbarBGImg.src = this.progressbarBGImgSrc;
  }

  this.update = function(part, total) {
    //console.log("Progressbar.update(" + part + "," + total + ")");

    var pct = part / total;
    if (this.isInitted) {
      if (part == undefined) part = 0;
      if (total== undefined) total = 100; // prevent divide by zero

      var progress = part / total;
      progress = Math.min(progress, 1.0);
      progress = Math.max(progress, 0);
      //console.log("progressbar >> f:update() >> progress: " + progress);

      // clear
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.context.drawImage(this.progressbarBGImg, 0, 0);

      this.context.font = "7pt sans-serif";

      // draw the progressbar foreground's clipping path
      this.context.save();
      this.context.beginPath();
      this.context.moveTo(45, 45);
      this.context.lineTo(45, 0);
      this.context.arc(45, 45, 45, -this.quartPI, -this.quartPI + (progress * (this.twoPI)), false); // circle bottom of thermometer
      this.context.lineTo(45, 45);
      this.context.clip();

      this.context.drawImage(this.progressbarFGImg, 0, 0);
      this.context.restore();

      if (debugMode) {
        this.context.fillStyle = '#222';
        this.context.strokeStyle = '#fff';
        this.context.lineWidth = 3;
        this.context.textAlign="center";
        this.context.strokeText(part + " / " + total, 45, 45, 90);
        this.context.fillText(part + " / " + total, 45, 45, 90);
      }

    } else {
      console.log("Progressbar.setTemperature() -> thermometer not initialized!");
    }
  }
  this.show = function() {
    this.$container.addClass("progressbarAppear");
    //  	this.$container.show();
    this.enabled = true;
  }
  this.hide = function() {
    this.$container.removeClass("progressbarAppear");
    //  	this.$container.hide();
      this.enabled = false;
  }
}

// TODO assess if this var is still necessary
var $displayThermometer = $("#thermometerContainer");


//TODO 2013-09-18 allow displaying temperatures HIGHER than the targTemp (it's now being capped at targTemp).
function Thermometer() {
  this.currentTemperature = 0; // default val
  this.targetTemperature = 0; // default val

  this.thermoOverlayImg = new Image();
  this.thermoOverlayImgSrc = "img/thermometer_fg_overlay.png"; // ../img/thermometer_fg_overlay.png

  this.thermoWidth= 40;
  this.thermoHeight = 100;

  this.$canvas;
  this.canvas;
  this.context;
  this.$container;
  
  this.isInitted = false;
  
  this.enabled = true;
  
  this.thermoColors = [
    [50, 200, 244], // 'cold'
    [244, 190, 10], // 'warming up'
    [244, 50, 50]   // 'ready / hot'
  ];

  this.init = function(targCanvas, targCanvasContainer) {
    console.log("Thermometer.init()");

    this.$container = targCanvasContainer;

    this.$canvas = targCanvas;
    this.canvas = this.$canvas[0];
    this.context = this.canvas.getContext('2d');


    var self = this;
    this.thermoOverlayImg.onload = function() {
      console.log("canvasThermoOverlay img loaded");
      self.isInitted = true;
      self.update(self.currentTemperature, self.targetTemperature);
    };
    this.thermoOverlayImg.src = this.thermoOverlayImgSrc;
  }

  this.update = function(curr, targ) {
    //      console.log("Thermometer.update(" + curr + "," + targ + ")");

    if (this.isInitted) {
    	if(!this.enabled) return;
      if (curr == undefined) curr = 0;
      if (targ== undefined) targ = 180; // prevent divide by zero

      var progress = curr / targ;

      progress = Math.min(progress, 1.0);
      progress = Math.max(progress, 0);

      var h = this.thermoHeight; // 94 // px
      var paddingUnder = 15; // how far is beginpoint from bottom of thermometer
      var paddingAbove = 25; // how far is endpoint from top of thermometer
      var endPoint = h * .8;
      var p = Math.floor((h - paddingUnder - paddingAbove) * progress); // %
      //    var tempHeight =

      var currColor = this.thermoColors[0];
      if (progress > 0.98) {
        currColor = this.thermoColors[2];
      } else if (progress > 0.25) {
        currColor = this.thermoColors[1];
      }

      // clear
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.font = "10pt sans-serif";

      // draw the thermometer clipping path
      this.context.save();
      this.context.beginPath();
      this.context.arc(40, 80, 16, 0, 2 * Math.PI, false); // circle bottom of thermometer
      this.context.arc(40, 10, 4, 0, 2 * Math.PI, false); // circle at top of thermometer tube
      this.context.rect(36, 11, 8, 70); // thermometer tube
      this.context.fillStyle = '#fff';
      this.context.fill();
      this.context.clip();

      // draw rectangle which represents temperature
      // rect will be clipped by the thermometer outlines
      this.context.beginPath();
      this.context.rect(20, h - paddingUnder - p, 60, p + paddingUnder);
      //console.log("   currColor: " + currColor);
      //todo Math.floor??
      this.context.fillStyle = "rgb(" + currColor[0] + "," + currColor[1] + "," + currColor[2] + ")";
      this.context.fill();
      this.context.restore();

      // additional text labels
      this.context.save();
      this.context.beginPath();
      this.context.moveTo(32, paddingAbove);
      this.context.lineTo(52, paddingAbove);
      this.context.lineWidth = 2;
      this.context.strokeStyle = '#000';
      this.context.stroke();
      this.context.fillStyle = '#000';
      this.context.textAlign = "left";
      this.context.textBaseline = "middle";
      this.context.fillText(targ + "°", 55, paddingAbove);
      this.context.restore();

      // the thermometer outline png
      this.context.drawImage(this.thermoOverlayImg, 20, 0);

      // text
      this.context.fillStyle = '#000';
      this.context.textAlign="center";
      this.context.fillText(curr + "°", 40, h + paddingUnder);
    } else {
      console.log("Thermometer.setTemperature() -> thermometer not initialized!");
    }
  }
  this.show = function() {
    this.$container.addClass("thermometerAppear");
//    $("#progressbarCanvasContainer").addClass("thermometerAppear");
//  	this.$container.show();
  	this.enabled = true;
  }
  this.hide = function() {
    this.$container.removeClass("thermometerAppear");
//    $("#progressbarCanvasContainer").removeClass("thermometerAppear");
//  	this.$container.hide();
  	this.enabled = false;
  }
}


// http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
function getURLParameter(name) {
  return decodeURI(
    (new RegExp('[&?]'+name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
  );
}

var sidebarLeft;
var sidebarRight;

function initSidebars() {
  console.log("f:initSidebars()");

  sidebarLeft = new SideBar();
  sidebarLeft.init(".leftpanel", "hideleft", function() {
    $(".leftpanel").show();
  });

  sidebarRight = new SideBar();
  sidebarRight.init(".rightpanel", "hideright", function() {
    $(".rightpanel").show();
  });
}

function SideBar() {
  this.initted = false;
  this.$contentTarg = undefined;
  this.$sideBtn = undefined;
  this.contentHidden = false;
  this.hideClass = "";

  this.init = function(targ, hideClass, callback) {
    console.log("SideBar >> f:init >> targ: " , $(targ) , ", hideClass: " + hideClass);
    this.$contentTarg = $(targ);
    this.hideClass = hideClass;

    this.$contentTarg.addClass(this.hideClass);
    this.contentHidden = true;

    this.$contentTarg.append("<div class='sidebutton'></div>");
    this.$sideBtn = $(targ +" .sidebutton");
    var self = this;

    this.$sideBtn.on('click', function(e) {
      console.log("sidebutton");
      self.toggleShowHide();
    });

    this.initted = true;

    callback();
  }

  this.toggleShowHide = function() {
    if (this.contentHidden) {
      this.contentHidden = false;
      this.$contentTarg.removeClass(this.hideClass);
      //        self.$sideBtn.addClass("sidebuttonin");
      this.$sideBtn.addClass("sidebuttonin");
    } else {
      this.contentHidden = true;
      this.$contentTarg.addClass(this.hideClass);
      //        self.$sideBtn.removeClass("sidebuttonin");
      this.$sideBtn.removeClass("sidebuttonin");

    }
  }
}


function Message() {
	
	Message.ERROR 			= "error";
	Message.WARNING 		= "warning";
	Message.NOTICE 			= "notice";
	Message.INFO 				= "info";
	
	this.mode						= "";
	
	this.$element;
	
	var self = this;
	var autoHideDelay = 2000;
	var autohideTimeout;
	
	this.init = function($element) {
    console.log("Message:init");
    
    this.$element = $element;
    console.log("$element: ",$element);
 	}
	
	this.set = function(text,mode,autoHide) {
		console.log("Message:set: ",text,mode,autoHide);
		self.hide(function() {
			self.show();
			self.clear();
			
			self.$element.text(text);
			self.$element.addClass(mode);
			self.show();
			
			self.mode = mode;
			
			clearTimeout(autohideTimeout);
			if(autoHide) {
				autohideTimeout = setTimeout(function(){ self.hide()},autoHideDelay);
			}
		});
	}
	this.clear = function($element) {
		this.$element.text("");
		this.$element.removeClass(this.mode);
	}
	
	this.show = function() {
		this.$element.fadeIn(200);
	}
	this.hide = function(complete) {
		this.$element.fadeOut(200,complete);
	}
}
var debugMode = false;              // debug mode
var sendPrintCommands = true;       // if Doodle3d should send print commands to the 3d printer
var communicateWithWifibox = true;  // if Doodle3d should try interfacing with the wifibox (in case one is not connected)
var wifiboxIsRemote = false;        // when you want to run the client on a computer and have it remotely connect to the wifibox
var autoUpdate = true; 							// auto retrieve updates about temperature and progress from printer

var printer =  new Printer();
var progressbar = new Progressbar();
var thermometer = new Thermometer();
var settingsWindow = new SettingsWindow();
var message = new Message();

var firstTimeSettingsLoaded = true;

var wifiboxURL; // Using the uhttpd lua handler as default, because of better performance
var wifiboxCGIBinURL; // CGI-bin, for some network stuff, where it needs to restart the webserver for example

var $drawAreaContainer, $doodleCanvas, doodleCanvas, doodleCanvasContext, $previewContainer;

var showhideInterval;
var showOrHide = false;

$(function() {
  console.log("ready");


  //TODO give this a more logical place in code

  if (getURLParameter("d") != "null") debugMode = (getURLParameter("d") == "1");
  if (getURLParameter("p") != "null") sendPrintCommands = (getURLParameter("p") == "1");
  if (getURLParameter("c") != "null") communicateWithWifibox = (getURLParameter("c") == "1");
  if (getURLParameter("r") != "null") wifiboxIsRemote = (getURLParameter("r") == "1");
  if (getURLParameter("u") != "null") autoUpdate = (getURLParameter("u") == "1");
  
	if (wifiboxIsRemote) {
		wifiboxURL = "http://192.168.5.1/d3dapi";
		wifiboxCGIBinURL = "http://192.168.5.1/cgi-bin/d3dapi";
	} else {
		wifiboxURL = "http://" + window.location.host + "/d3dapi";
		wifiboxCGIBinURL = "http://" + window.location.host + "/cgi-bin/d3dapi";
	}

  if (!communicateWithWifibox) {
    sendPrintCommands = false; // 'communicateWithWifibox = false' implies this
  }
  console.log("debugMode: " + debugMode);
  console.log("sendPrintCommands: " + sendPrintCommands);
  console.log("communicateWithWifibox: " + communicateWithWifibox);
  console.log("wifiboxIsRemote: " + wifiboxIsRemote);
  console.log("wifibox URL: " + wifiboxURL);

  initDoodleDrawing();
  initPreviewRendering();
  initLayouting();
  initSidebars();
  initButtonBehavior();
  initVerticalShapes();

	thermometer.init($("#thermometerCanvas"), $("#thermometerContainer"));
  progressbar.init($("#progressbarCanvas"), $("#progressbarCanvasContainer"));

  message.init($("#message"));
  
  printer.init();
	$(document).on(Printer.UPDATE,update);

	settingsWindow.init(wifiboxURL,wifiboxCGIBinURL);
	$(document).on(SettingsWindow.SETTINGS_LOADED, settingsLoaded);

  if(debugMode) {
    console.log("debug mode is true");
    $("body").css("overflow", "auto");
    $("#debug_textArea").css("display", "block");
    $("#preview_tmp").css("display", "block");
    
    $("#debug_display").css("display", "block");

    // show and hide the progressguage and thermometer
    //showhideInterval = setInterval(showOrHideThermo, 2500);

//    $("#debugContainer").css("display", "block");

    /* TEMP CODE!! -> artificially populates the startgcode and endgcode textareas in the settings window */
    // todo remove this temporary code...
    /*
    setTimeout(function() {
      $("#startgcode").text("");
      $("#startgcode").append("G21 (mm) \n");
      $("#startgcode").append("G91 (relative) \n");
      $("#startgcode").append("G28 X0 Y0 Z0 (physical home) \n");
      $("#startgcode").append("M104 S230 (temperature) \n");
      $("#startgcode").append("G1 E10 F250 (flow) \n");
      $("#startgcode").append("G92 X-100 Y-100 Z0 E10 \n");
      $("#startgcode").append("G1 Z3 F5000 (prevent diagonal line) \n");
      $("#startgcode").append("G90 (absolute) \n");
      $("#startgcode").append("M106 (fan on)");
      console.log("$('#startgcode'): " + $("#startgcode").val());

      $("#endgcode").text("");
      $("#endgcode").append("G1 X-100 Y-100 F15000 (fast homing) \n");
      $("#endgcode").append("M107 \n");
      $("#endgcode").append("M84 (disable axes) \n");
      console.log("$('#endgcode'): " + $("#endgcode").val());
    }, 1000);
    //*/
  }
});

function showOrHideThermo() {
  console.log("f:showOrHideThermo()");
  if (showOrHide) {
    thermometer.hide();
    progressbar.hide();
  } else {
    thermometer.show();
    progressbar.show();

  }
  showOrHide = !showOrHide;
}

function settingsLoaded() {
	console.log("settingsLoaded");
	console.log("autoHeatup: ",settings["printer.heatup.enabled"]);
	if(settings["printer.heatup.enabled"]) {
		if(firstTimeSettingsLoaded) {
			printer.preheat();
			firstTimeSettingsLoaded = false;
		}
	}
}

function setDebugText(text) {
	$("#debug_display").text(text);
}