/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

var API = function() {
	
	var _wifiboxURL = 'http://192.168.5.1/d3dapi/';
	var _wifiboxCGIBinURL = 'http://192.168.5.1/cgi-bin/d3dapi/';
	var _timeoutTime = 10000;

	function post(cmd,data,success,fail) {
		$.ajax({
			url: _wifiboxURL + cmd,
			type: "POST",
			data: data,
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if(response.status == "error" || response.status == "fail") {
					console.log('API.post fail',cmd)
					if (fail) fail(response);
				} else {
					if (success) success(response.data);
					else console.log('API.post:',cmd,'success cb undefined')
				}
			}
		}).fail(function(jqXHR, textStatus) {
			console.log('API.post fail',cmd,jqXHR,textStatus);
			if (fail) fail(jqXHR,textStatus);
		});
	}

	function get(cmd,success,fail) {
		$.ajax({
			url: _wifiboxURL + cmd,
			type: "GET",
			dataType: 'json',
			timeout: _timeoutTime,
			success: function(response){
				if (response.status == "error" || response.status == "fail") {
					console.log('API.get fail',cmd,response);
					if (fail) fail(response);
				} else {
					if (success) success(response.data);
					else console.log('API.get:',cmd,'success cb undefined')
				}
			}
		}).fail(function() {
			console.log('API.get fail',cmd);
			if (fail) fail();
		});
	}

	return {
		get: get,
		post: post
	}

}();

