/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function UpdatePanel() {
	var _form = new FormPanel();

	this.wifiboxURL;
	this.element;

	this.statusCheckInterval = 1000;
	this.statusCheckDelayer; 			// setTimout instance
	this.installedDelay = 90*1000; 		// Since we can't retrieve status during installation we show the installed text after a fixed delay
	this.installedDelayer; 				// setTimout instance
	this.retryDelay = 1000;
	this.retryDelayer; 					// setTimout instance
	//this.timeoutTime = 3000;

	this.canUpdate = false;
	this.currentVersion = "";
	this.newestVersion;
	this.currentReleaseDate;
	this.newestReleaseDate;
	this.progress;
	this.imageSize;
	var _inAccessPointMode;

	// states from api, see Doodle3D firmware src/script/d3d-updater.lua
	UpdatePanel.NONE 			= 1; // default state
	UpdatePanel.DOWNLOADING  	= 2;
	UpdatePanel.DOWNLOAD_FAILED	= 3;
	UpdatePanel.IMAGE_READY 	= 4; // download successful and checked
	UpdatePanel.INSTALLING 		= 5;
	UpdatePanel.INSTALLED 		= 6;
	UpdatePanel.INSTALL_FAILED 	= 7;

	this.state; // update state from api
	this.stateText = ""; // update state text from api

	var self = this;

	this.init = function(wifiboxURL,updatePanelElement) {
		_form.init(wifiboxURL,wifiboxURL,updatePanelElement);

		this.wifiboxURL = wifiboxURL;

		this.element = updatePanelElement;
		this.retainCheckbox = this.element.find("#retainConfiguration");
		this.includeBetasCheckbox = this.element.find("#includeBetas");
		this.btnUpdate = this.element.find("#update");
		this.statusDisplay = this.element.find("#updateState");
		this.infoDisplay = this.element.find("#updateInfo");

		this.retainCheckbox.change(this.retainChanged);
		this.includeBetasCheckbox.change(this.includeBetasChanged);
		this.btnUpdate.click(this.update);

		this.checkStatus(false);
	}

	this.retainChanged = function(e) {
		//console.log("UpdatePanel:retainChanged");
		//this call ensures that the update button gets enabled if (!retainChanged && !canUpdate)
		self.setState(self.state,true);
	}

	this.includeBetasChanged = function() {
		//console.log("UpdatePanel:includeBetasChanged");
		_form.saveSettings(_form.readForm(),function(validated, data) {
			if(validated) self.checkStatus(false);
		});
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

		// should personal sketches and settings be retained over update?
		var retain = self.retainCheckbox.prop('checked');
		console.log("  retain: ",retain);

		self.stopCheckingStatus();
		postData = {no_retain:!retain}
		$.ajax({
			url: self.wifiboxURL + "/update/install",
			type: "POST",
			data: postData,
			dataType: 'json',
			success: function(response){
				console.log("UpdatePanel:installUpdate response: ",response);
			}
		}).fail(function() {
			//console.log("UpdatePanel:installUpdate: no respons (there shouldn't be)");
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
				} else {
					console.log("API update/status call returned an error: '" + response.msg + "'");
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
		//status texts and button state might have to be updated if the newest version changes (e.g., after (un)ticking include betas checkbox)
		var refreshUI = (self.newestVersion != data.newest_version);

		self.canUpdate 				= data.can_update;

		if(self.currentVersion != data.current_version || self.newestVersion != data.newest_version) {
			self.currentVersion 	= data.current_version;
			self.newestVersion 		= data.newest_version;
			self.currentReleaseDate	= data.current_release_date; // not always available (for older versions)
			self.newestReleaseDate	= data.newest_release_date; // not always available (for older versions)
			self.updateInfoDisplay();
		}

		self.stateText 				= data.state_text;
		self.progress 				= data.progress; // not always available
		self.imageSize 				= data.image_size; // not always available

		self.setState(data.state_code, refreshUI);

		switch(this.state){
			case UpdatePanel.IMAGE_READY:
				self.installUpdate();
				break;
		}
	}

	this.setState = function(newState,refresh) {
		//console.log("UpdatePanel:setState");
		if(!refresh && this.state == newState) return;
		console.log("UpdatePanel:setState: ",this.state," > ",newState,"(",this.stateText,") (in Access Point Mode: ",_inAccessPointMode,") (newestVersion: ",self.newestVersion,") (refresh: ",refresh,")");
		this.state = newState;

		// should personal sketches and settings be retained over update?
		var retain = self.retainCheckbox.prop('checked');
		//console.log("  retain", retain);

		// download button
		// if there isn't newestVersion data something went wrong,
		//   probably accessing the internet
		//console.log("  self.newestVersion: ",self.newestVersion);
		if(self.newestVersion != undefined) {
			//console.log("  this.state: ",this.state);
			switch(this.state){
				case UpdatePanel.NONE:
				case UpdatePanel.DOWNLOAD_FAILED:
				case UpdatePanel.INSTALL_FAILED:
					//console.log("  self.canUpdate: ",self.canUpdate);
					if(self.canUpdate || !retain) {
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
						var currIsBeta = self.versionIsBeta(self.currentVersion);
						var newIsBeta = self.versionIsBeta(self.newestVersion);
						var relIsNewer = (self.newestReleaseDate && self.currentReleaseDate) ? (self.newestReleaseDate - self.currentReleaseDate > 0) : true;

						if (!newIsBeta) {
							if (relIsNewer) text = "Update available.";
							else text = "You can switch back to the latest stable release."; //this case is always a beta->stable 'downgrade'
						} else {
							//NOTE: actually, an older beta will never be presented as update by the API
							var prefixText = currIsBeta ? "A" : (relIsNewer ? "A newer" : "An older");
							text = prefixText + " beta release is available.";
						}
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
					//text = "Update complete, please reconnect by connecting your device to the access point of your WiFi box and going to <a href='http://draw.doodle3d.com'>draw.doodle3d.com</a>";
					text = "Update complete, please <a href='javascript:location.reload(true);'>refresh Page</a>.";
					break;
				case UpdatePanel.INSTALL_FAILED:
					text = "Installing update failed.";
					break;
			}
		} else {
			if(_inAccessPointMode) {
				text = "Can't access internet in access point mode.";
			} else {
				text = "Can't access internet.";
			}
		}
		this.statusDisplay.html(text);
	}

	this.updateInfoDisplay = function() {
		var html = 'Current version: ' + self.currentVersion;
		if (self.currentReleaseDate) html += '; released: ' + self.formatDate(self.currentReleaseDate);
		html += ' (<a target="d3d-curr-relnotes" href="ReleaseNotes.html">release notes</a>).';

		if(self.canUpdate) {
			html += '<br/>Latest version: ' + self.newestVersion;
			if (self.newestReleaseDate) html += '; released: ' + self.formatDate(self.newestReleaseDate);
			html += ' (<a target="d3d-new-relnotes" href="http://doodle3d.com/updates/images/ReleaseNotes.md">release notes</a>).';
		}
		self.infoDisplay.html(html);
	}


	this.setInAccessPointMode = function(inAccessPointMode) {
		_inAccessPointMode = inAccessPointMode;
		self.updateStatusDisplay();
	}

	this.formatDate = function(ts) {
		if (!ts || ts.length != 8 || !/^[0-9]+$/.test(ts)) return null;
		var fields = [ ts.substr(0, 4), ts.substr(4, 2), ts.substr(6, 2) ];
		if (!fields || fields.length != 3 || fields[1] > 12) return null;

		var abbrMonths = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Sep', 'Aug', 'Oct', 'Nov', 'Dec' ];
		return abbrMonths[fields[1] - 1] + " " + fields[2] + ", " + fields[0];
	}

	this.versionIsBeta = function(version) {
		return version ? /.*-.*/g.test(version) : null;
	}
}
