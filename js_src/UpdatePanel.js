/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function UpdatePanel() {
	this.wifiboxURL;
	this.element;
	
	this.statusCheckInterval 	= 1000; 
	this.statusCheckDelayer; 						// setTimout instance
	this.installedDelay 			= 90*1000; 			// Since we can't retrieve status during installation we show the installed text after a fixed delay	
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
		this.noRetainCheckbox = this.element.find("#noRetain");
		this.btnUpdate = this.element.find("#update");
		this.statusDisplay = this.element.find("#updateState");
		this.infoDisplay = this.element.find("#updateInfo");
		
		this.noRetainCheckbox.change(this.noRetainChanged);
		this.btnUpdate.click(this.update);
		
		this.checkStatus(false);
	}
	this.noRetainChanged = function(e) {
		console.log("UpdatePanel:noRetainChanged");
		
		self.setState(self.state,true);
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
		
		var noRetain = self.noRetainCheckbox.prop('checked');
		
		self.stopCheckingStatus();
		postData = {no_retain:noRetain}
		$.ajax({
			url: self.wifiboxURL + "/update/install",
			type: "POST",
			data: postData,
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
	this.setState = function(newState,refresh) {
		console.log("UpdatePanel:setState");
		if(!refresh && this.state == newState) return;
		console.log("UpdatePanel:setState: ",this.state," > ",newState,"(",this.stateText,") (networkMode: ",self.networkMode,") (newestVersion: ",self.newestVersion,") (refresh: ",refresh,")");
		this.state = newState;
		
		var noRetain = self.noRetainCheckbox.prop('checked');
		console.log("  noRetain", noRetain);
		
		// download button
		// if there isn't newestVersion data something went wrong, 
		//   probably accessing the internet
		console.log("  self.newestVersion: ",self.newestVersion);
		if(self.newestVersion != undefined) {
			console.log("  this.state: ",this.state);
			switch(this.state){
				case UpdatePanel.NONE: 
				case UpdatePanel.DOWNLOAD_FAILED:
				case UpdatePanel.INSTALL_FAILED:
					console.log("  self.canUpdate: ",self.canUpdate);
					if(self.canUpdate || noRetain) {
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
					text = "Update complete, please reconnect by connecting your device to the access point of your WiFi box and going to <a href='http://draw.doodle3d.com'>draw.doodle3d.com</a>";
					//text = "Update complete, please <a href='javascript:location.reload(true);'>refresh Page</a>.";
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
		var html = 'Current version: ' + self.currentVersion +
			' (<a target="d3d-curr-relnotes" href="ReleaseNotes.html">release notes</a>). ';
		if(self.canUpdate) {
			html += 'Latest version: ' + self.newestVersion +
				' (<a target="d3d-new-relnotes" href="http://doodle3d.com/updates/images/ReleaseNotes.md">release notes</a>).';
		}
		self.infoDisplay.html(html);
	}
	this.setNetworkMode = function(networkMode) {
		self.networkMode = networkMode;
	}
}
