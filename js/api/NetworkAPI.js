/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
function NetworkAPI() {
	
	NetworkAPI.STATUS = {
		CONNECTING_FAILED: -1,
		NOT_CONNECTED: 0,
		CONNECTING: 1,
		CONNECTED: 2,
		CREATING: 3,
		CREATED: 4
	};
	
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	var _timeoutTime = 3000;
	
	var _self = this;

	this.init = function(wifiboxURL,wifiboxCGIBinURL) {
		//console.log("NetworkAPI:init");
		//console.log("  wifiboxURL: ",wifiboxURL);
		//console.log("  wifiboxCGIBinURL: ",wifiboxCGIBinURL);
		_wifiboxURL = wifiboxURL;
		_wifiboxCGIBinURL = wifiboxCGIBinURL;
	}
	this.scan = function(completeHandler,failedHandler) {
		//console.log("NetworkAPI:scan");
		$.ajax({
			url: _wifiboxURL + "/network/scan",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:scan response: ",response);
				if(response.status == "error" || response.status == "fail") {
					//console.log("NetworkAPI:scan failed: ",response);
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			//console.log("NetworkAPI:scan failed");
			if(failedHandler) failedHandler();
		});
	};
	this.status = function(completeHandler,failedHandler) {
		//console.log("NetworkAPI:status");
		$.ajax({
			url: _wifiboxURL + "/network/status",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:status response: ",response);
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
	
	this.associate = function(ssid,phrase,recreate) {
		//console.log("NetworkAPI:associate");
		var postData = {
				ssid:ssid,
				phrase:phrase,
				recreate:recreate
		};
		$.ajax({
			url: _wifiboxCGIBinURL + "/network/associate",
			type: "POST",
			data: postData,
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:associate response: ",response);
			}
		}).fail(function() {
			//console.log("NetworkAPI:associate: timeout (normal behavior)");
		});
	};
	
	this.openAP = function() {
		//console.log("NetworkAPI:openAP");
		$.ajax({
			url: _wifiboxCGIBinURL + "/network/openap",
			type: "POST",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:openAP response: ",response);
			}
		}).fail(function() {
			//console.log("NetworkAPI:openAP: timeout (normal behavior)");
		});
	};
	
	this.signin = function() {
		$.ajax({
			url: _wifiboxCGIBinURL + "/network/signin",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("NetworkAPI:signin response: ",response);
			}
		}).fail(function() {
			//console.log("NetworkAPI:signin: failed");
		});
	};
}