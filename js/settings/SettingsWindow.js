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
	
	var _window;
	var _btnOK;
	
	var _wifiboxURL;
	var _restoredStateHideDelayTime = 3000;
	var _restoredStateHideDelay; // setTimout instance

	// Events
	SettingsWindow.SETTINGS_LOADED 		= "settingsLoaded";
	
	var _form = new FormPanel();
	var _updatePanel = new UpdatePanel();
	var _printerPanel = new PrinterPanel();
	var _networkPanel = new NetworkPanel();
	var _networkAPI = new NetworkAPI();
	
	var _restoreStateField
	
	var self = this;

	this.init = function(wifiboxURL,wifiboxCGIBinURL) {
		
		_wifiboxURL = wifiboxURL;

		_window = $("#popupSettings");
		_btnOK = _window.find(".btnOK");
		settingsPopup = new Popup($("#popupSettings"), $("#popupMask"));
		settingsPopup.setEnterEnabled(false);
		settingsPopup.setAutoCloseEnabled(false);
		
		_btnOK.on('touchstart mousedown',settingsPopup.commit);
		$("#popupSettings").bind("onPopupCancel", function() { settingsPopup.close(); } );
		$("#popupSettings").bind("onPopupCommit", self.submitwindow);
		
		_networkAPI.init(wifiboxURL,wifiboxCGIBinURL);
		
		// Load external settings.html into SettingsWindow
		_window.find("#settingsContainer").load("settings.html", function() {
			console.log("Settings:finished loading settings.html");

			var formElement = _window.find("form");
			formElement.submit(function (e) { self.submitwindow(e); });
			
			_form.init(wifiboxURL,wifiboxCGIBinURL,formElement);
			
			// printer panel
			var printerPanelElement = formElement.find("#printerPanel");
			_printerPanel.init(wifiboxURL,wifiboxCGIBinURL,printerPanelElement);
			
			// Load printer types list 
			// First, because after the settings are loaded the printer type need to be selected 
			_printerPanel.load(function() {
				
				_restoreStateField	= formElement.find("#restoreState");
				self.btnRestoreSettings	= formElement.find("#restoreSettings");
				self.btnRestoreSettings.on('touchstart mousedown',self.resetSettings);

				// network panel
				var $networkPanelElement = formElement.find("#networkPanel");
				_networkPanel.init(wifiboxURL,wifiboxCGIBinURL,$networkPanelElement);
				
				
				// update panel
				var updatePanelElement = formElement.find("#updatePanel");
				_updatePanel.init(wifiboxURL,updatePanelElement);
				_networkPanel.setNetworkModeChangedHandler(function(networkMode) {
					var inAccessPointMode = (networkMode == NetworkPanel.NETWORK_MODE.ACCESS_POINT);
					_updatePanel.setInAccessPointMode(inAccessPointMode);
				});
				
				self.loadSettings();
				
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
		_btnOK.attr("disabled",true);
		e.preventDefault();
		e.stopPropagation();
		var newSettings = _form.readForm();
		_form.saveSettings(newSettings,function(validated, data){
			if(validated) {
				settings = newSettings; // store new settings in global settings
				settingsPopup.close();
				self.signin();
			}
			_btnOK.removeAttr("disabled");
		});
	};
	
	this.loadSettings = function(complete) {
		_form.loadAllSettings(function(loadedSettings){
			console.log("Settings:loaded settings: ",loadedSettings);
			settings = loadedSettings;
			_form.fillForm(settings);
			$(document).trigger(SettingsWindow.SETTINGS_LOADED);
			if(complete) complete();
		});
		_networkPanel.update();
	};
	
	this.resetSettings = function() {
		console.log("resetSettings");
		self.btnRestoreSettings.attr("disabled", true);
		clearTimeout(_restoredStateHideDelay);
		self.setRestoreState("Restoring...");
		_form.resetAllSettings(function(restoredSettings) { 
			//console.log("  settings: ",restoredSettings);
			settings = restoredSettings;
			_form.fillForm(restoredSettings);
			$(document).trigger(SettingsWindow.SETTINGS_LOADED);

			self.btnRestoreSettings.removeAttr("disabled");
			self.setRestoreState("Settings restored");
			// auto hide status
			clearTimeout(_restoredStateHideDelay);
			_restoredStateHideDelay = setTimeout(function() { self.setRestoreState("");	},_restoredStateHideDelayTime);
		});
	};
	
	this.setRestoreState = function(text) {
		_restoreStateField.html(text);
	};

	this.signin = function() {
		_networkAPI.signin();
	};

	this.downloadlogs = function() {
		window.location.href = _wifiboxURL + "/info/logfiles";
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