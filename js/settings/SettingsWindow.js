/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

//these settings are defined in the firmware (conf_defaults.lua) and will be initialized in loadSettings()
var settings = {};
var settingsPopup;
//wrapper to prevent scoping issues in showSettings()
function openSettingsWindow() {
	settingsWindow.loadSettings(function() { // reload settings
		settingsPopup.open();
	});
}

function SettingsWindow() {
	this.wifiboxURL;
	this.wifiboxCGIBinURL;
	this.window;
	this.btnOK;
	this.form;
	this.timeoutTime = 3000;
	this.saveSettingsTimeoutTime = 8000;
	this.retryDelay = 2000; 					// retry setTimout delay

	this.retryLoadSettingsDelay; 			// retry setTimout instance
	this.retrySaveSettingsDelay; 			// retry setTimout instance
	this.retryResetSettingsDelay; 			// retry setTimout instance
	
	this.restoreStateField
	this.restoredStateHideDelayTime = 3000;
	this.restoredStateHideDelay; // setTimout instance

	// Events
	SettingsWindow.SETTINGS_LOADED 		= "settingsLoaded";
	
	this.updatePanel = new UpdatePanel();
	this.printerPanel = new PrinterPanel();
	var _networkPanel = new NetworkPanel();
	
	var self = this;

	this.init = function(wifiboxURL,wifiboxCGIBinURL) {
		
		this.wifiboxURL = wifiboxURL;
		this.wifiboxCGIBinURL = wifiboxCGIBinURL;

		this.window = $("#popupSettings");
		this.btnOK = this.window.find(".btnOK");
		settingsPopup = new Popup($("#popupSettings"), $("#popupMask"));
		settingsPopup.setEnterEnabled(false);
		settingsPopup.setAutoCloseEnabled(false);
		
		this.btnOK.on('touchstart mousedown',settingsPopup.commit);
		$("#popupSettings").bind("onPopupCancel", function() { settingsPopup.close(); } );
		$("#popupSettings").bind("onPopupCommit", self.submitwindow);
		
		this.window.find("#settingsContainer").load("settings.html", function() {
			console.log("Settings:finished loading settings.html, now loading settings...");

			self.form = self.window.find("form");
			self.form.submit(function (e) { self.submitwindow(e); });
			
			$.ajax({
				url: self.wifiboxURL + "/printer/listall",
				dataType: 'json',
				timeout: self.timeoutTime,
				success: function(response) {
					console.log("Settings:printer/listall response: ",response.data.printers);
					//console.log("  this: ",this);
					// network panel
					console.log("initialize network panel");
					var $networkPanelElement = self.form.find("#networkPanel");
					_networkPanel.init(wifiboxURL,wifiboxCGIBinURL,$networkPanelElement);
										
					$.each(response.data.printers, function(key, value) {
						// console.log(key,value);
						$('#printerType').append($('<option>').text(value).attr('value', key));
					});

					self.loadSettings();

					self.restoreStateField	= self.form.find("#restoreState");
					self.btnRestoreSettings	= self.form.find("#restoreSettings");
					self.btnRestoreSettings.on('touchstart mousedown',self.resetSettings);

					// update panel
					var $updatePanelElement = self.form.find("#updatePanel");
					self.updatePanel.init(wifiboxURL,$updatePanelElement);

					// printer panel
					var $printerPanelElement = self.form.find("#printerPanel");
					self.printerPanel.init(wifiboxURL,$printerPanelElement);
					self.printerPanel.fillForm = self.fillForm;
					
					
				}
			}).fail(function() {
				console.log("FATAL ERROR: Settings:printer/listall failed");
			});
		}); //this.window.find

	}; //this.init
	
	this.openSettings = function() {
		self.loadSettings(function() { // reload settings
			settingsPopup.open();
		});
	};
	
//	this.closeSettings = function(complete) {
//		settingsPopup.close(complete);
//	};

	this.submitwindow = function(e) {
		self.btnOK.attr("disabled",true);
		e.preventDefault();
		e.stopPropagation();
		self.saveSettings(self.readForm(),function(success){
			if(success) {
				settingsPopup.close();
				self.signin();
			}
			self.btnOK.removeAttr("disabled");
		});

		clearTimeout(self.retryRetrieveNetworkStatusDelay);
	};

	this.loadSettings = function(complete) {
		if (!communicateWithWifibox) {
			console.log("     communicateWithWifibox is false: settings aren't being loaded from wifibox...");
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
				self.fillForm(settings);
				$(document).trigger(SettingsWindow.SETTINGS_LOADED);
				if(complete) complete();
			}
		}).fail(function() {
			console.log("Settings:loadSettings: failed");
			clearTimeout(self.retryLoadSettingsDelay);
			self.retryLoadSettingsDelay = setTimeout(function() { self.loadSettings(); },self.retryDelay); // retry after delay
		});
		
		_networkPanel.update();
	};
	
	this.fillForm = function(settings,form) { 
		if(!form) form = this.form; // if no form specified, fill whole form

		//fill form with loaded settings
		var selects = form.find("select");
		selects.each( function(index,element) {
			var elem = $(element);
			elem.val(settings[elem.attr('name')]);
		});
		var inputs = form.find("input");
		inputs.each( function(index,element) {
			var elem = $(element);
			//console.log("printer setting input: ",index,element.attr("type"),element.attr('name')); //,element);
			switch(elem.attr("type")) {
			case "text":
			case "number":
				elem.val(settings[elem.attr('name')]);
				break;
			case "checkbox":
				elem.prop('checked', settings[elem.attr('name')]);
				break;
			}
		});
		var textareas = form.find("textarea");
		textareas.each( function(index,element) {
			var elem = $(element);
			var value = settings[elem.attr('name')];
			elem.val(value);
		});
	};

	this.saveSettings = function(newSettings,complete) {
		settings = newSettings; // store new settings in global settings
		if (communicateWithWifibox) {
			$.ajax({
				url: self.wifiboxCGIBinURL + "/config",
				type: "POST",
				data: newSettings,
				dataType: 'json',
				timeout: self.saveSettingsTimeoutTime,
				success: function(response){
					console.log("Settings:saveSettings response: ",response);
					if(response.status == "error") {
						clearTimeout(self.retrySaveSettingsDelay);
						self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings(settings,complete); },self.retryDelay); // retry after delay
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
				self.retrySaveSettingsDelay = setTimeout(function() { self.saveSettings(settings,complete); },self.retryDelay); // retry after delay
			});
		}
	};
	
	this.resetSettings = function() {
		console.log("resetSettings");
		self.btnRestoreSettings.attr("disabled", true);

		clearTimeout(self.restoredStateHideDelay);

		self.setRestoreState("Restoring...");

		//console.log("  self.wifiboxURL: ",self.wifiboxURL);

		if (communicateWithWifibox) {
			$.ajax({
				url: self.wifiboxCGIBinURL + "/config/resetall",
				type: "POST",
				dataType: 'json',
				timeout: this.timeoutTime,
				success: function(response){
					console.log("Settings:resetSettings response: ",response);
					if(response.status == "error") {
						clearTimeout(self.retryResetSettingsDelay);
						self.retryResetSettingsDelay = setTimeout(function() { self.resetSettings(); },self.retryDelay); // retry after delay
					} else {
						settings = response.data;
						console.log("  settings: ",settings);
						self.fillForm(settings);
						$(document).trigger(SettingsWindow.SETTINGS_LOADED);

						self.btnRestoreSettings.removeAttr("disabled");
						self.setRestoreState("Settings restored");
						// auto hide status
						clearTimeout(self.restoredStateHideDelay);
						self.restoredStateHideDelay = setTimeout(function() { self.setRestoreState("");	},self.restoredStateHideDelayTime);
					}
				}
			}).fail(function() {
				console.log("Settings:resetSettings: failed");
				clearTimeout(self.retryResetSettingsDelay);
				self.retryResetSettingsDelay = setTimeout(function() { self.resetSettings(); },self.retryDelay); // retry after delay
			});
		}
	};
	
	this.setRestoreState = function(text) {
		self.restoreStateField.html(text);
	};
	
	this.displayValidationError = function(key,msg) {
		var formElement = self.form.find("[name|='"+key+"']");
		formElement.addClass("error");
		var errorMsg = "<p class='errorMsg'>"+msg+"</p>";
		formElement.after(errorMsg);
	};
	
	this.clearValidationErrors = function() {
		self.form.find(".errorMsg").remove();
		self.form.find(".error").removeClass("error");
	};

	this.readForm = function() {
		//console.log("SettingsWindow:readForm");
		var settings = {};
		var selects = self.form.find("select");
		selects.each( function(index,element) {
			var elem = $(element);
			//var fieldName = elem.attr('name');
			if(elem.attr('name') != "") {
				settings[elem.attr('name')] = elem.val();
			}
		});

		var inputs = self.form.find("input");
		inputs.each( function(index,element) {
			var elem = $(element);
			if(elem.attr('name') != "") {
				switch(elem.attr("type")) {
				case "text":
				case "number":
					settings[elem.attr('name')] = elem.val();
					break;
				case "checkbox":
					settings[elem.attr('name')] = elem.prop('checked');
					break;
				}
			}
		});

		var textareas = self.form.find("textarea");
		textareas.each( function(index,element) {
			var elem = $(element);
			settings[elem.attr('name')] = elem.val();
		});
		//console.log(settings);
		return settings;
	};

	this.signin = function() {
		
		// TODO use api.network 
		
	};

	this.downloadlogs = function() {
		window.location.href = self.wifiboxURL + "/info/logfiles";
	};

	this.downloadGcode = function() {
		var gcode = generate_gcode();
		if (gcode!=undefined) {
			var blob = new Blob([gcode.join("\n")], {type: "text/plain;charset=utf-8"});
			saveAs(blob, "doodle3d.gcode");
		}
	};

	this.downloadSvg = function() {
		var svg = saveToSvg();
		if (svg!=undefined) {
			var blob = new Blob([svg], {type: "text/plain;charset=utf-8"});
			saveAs(blob, "doodle3d.svg");
		}
	};
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