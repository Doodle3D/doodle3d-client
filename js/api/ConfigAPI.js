/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function ConfigAPI() {
	
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	var _timeoutTime 							= 3000;
	var _saveSettingsTimeoutTime 	= 8000;
	
	var _self = this;

	this.init = function(wifiboxURL,wifiboxCGIBinURL) {
		//console.log("ConfigAPI:init");
		
		_wifiboxURL = wifiboxURL;
		_wifiboxCGIBinURL = wifiboxCGIBinURL;
	}
	this.loadAll = function(completeHandler,failedHandler) {
		//console.log("ConfigAPI:loadAll");
		$.ajax({
			url: _wifiboxURL + "/config/all",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};
	this.load = function(targetSettings,completeHandler,failedHandler) {
		//console.log("ConfigAPI:load");
		$.ajax({
			url: _wifiboxURL + "/config/",
			type: "GET",
			dataType: 'json',
			data: targetSettings,
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};
	this.save = function(newSettings,completeHandler,failedHandler) {
		//console.log("ConfigAPI:save");
		$.ajax({
			url: _wifiboxCGIBinURL + "/config",
			type: "POST",
			data: newSettings,
			dataType: 'json',
			timeout: _saveSettingsTimeoutTime,
			success: function(response){
				//console.log("ConfigAPI:save response: ",response);
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};
	this.resetAll = function(completeHandler,failedHandler) {
		//console.log("ConfigAPI:resetAll");
		$.ajax({
			url: _wifiboxCGIBinURL + "/config/resetall",
			type: "POST",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			if(failedHandler) failedHandler();
		});
	};
}