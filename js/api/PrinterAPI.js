/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
function PrinterAPI() {
	
	var _wifiboxURL;
	var _wifiboxCGIBinURL;
	var _timeoutTime = 3000;
	
	var _self = this;

	this.init = function(wifiboxURL,wifiboxCGIBinURL) {
		//console.log("PrinterAPI:init");
		//console.log("  wifiboxURL: ",wifiboxURL);
		//console.log("  wifiboxCGIBinURL: ",wifiboxCGIBinURL);
		_wifiboxURL = wifiboxURL;
		_wifiboxCGIBinURL = wifiboxCGIBinURL;
	}
	
	this.listAll = function(completeHandler,failedHandler) {
		//console.log("PrinterAPI:listAll");
		//console.log("  _wifiboxURL: ",_wifiboxURL);
		$.ajax({
			url: _wifiboxURL + "/printer/listall",
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				//console.log("PrinterAPI response: ",response);
				if(response.status == "error" || response.status == "fail") {
					//console.log("PrinterAPI:listAll failed: ",response);
					if(failedHandler) failedHandler(response);
				} else {
					completeHandler(response.data);
				}
			}
		}).fail(function() {
			//console.log("PrinterAPI:listAll failed");
			if(failedHandler) failedHandler();
		});
	};
}