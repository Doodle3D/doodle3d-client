/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function PrinterAPI() {
	var className = 'PrinterAPI';

	this.remainingLines = [];
	this.totalLinesAtStart = 0;

	this.init = function() {
		console.log(className,'init is deprecated');
	}

	this.state = function(success,fail) {
		API.get('printer/state',{},success,fail);
	};
	
	this.listAll = function(success,fail) {
		API.get('printer/listall',{},success,fail);
	};

	this.temperature = function(success,fail) {
		API.get('printer/temperature',{},success,fail);
	};

	this.progress = function(success,fail) {
		API.get('printer/progress',{},success,fail);
	}

	function _printPartPost(lines,data,cb) {
		
		API.post('printer/print',data,function(response) {
			console.log('print part success',response);
			setTimeout(function() {
				_printPart(lines,false,false,cb);
			},10);

		},function(jqXHR,textStatus) {
			console.log('print fail jqHXR:',jqXHR,"textStatus:",textStatus);
			if (textStatus=="timeout") {
				console.log('TIMEOUT, waiting to try again');
				setTimeout(function() {
					console.log('now try again');
					_printPartPost(lines,data,cb);
				},5000);
			} else {
				console.log("_printPartPost FATAL error:",textStatus);
			}
		});
	}

	function _printPart(lines,first,start,cb) {
		var chunk = lines.splice(0,500);
		console.log('printPart',chunk.length,lines.length);

		if (chunk.length>0) {
			var data = {gcode: chunk.join("\n"), first: first, start: start};
			
			_printPartPost(lines,data,function() {
				// console.log('_printPartPost cb');
				// cb(); //??? needed
			});

		} else {
			console.log('no more print parts');
			cb(); //finished
		}
	}

	this.print = function(gcode,start,first,success,fail) {
		//need a check here for state??
		this.remainingLines = gcode.split("\n");
		this.totalLinesAtStart = this.remainingLines.length;
		// console.log('remainingLines.length',this.remainingLines.length);
		_printPart(this.remainingLines,true,true,function() {
			console.log('done sending');
		});
	};

	this.stop = function(endcode,success,fail) {
		//need a check here for state??
		// console.log('remainingLines',this.remainingLines.length);
		this.remainingLines.length = 0; //clear array
		totalLinesAtStart = 0;
		API.post('printer/stop',{gcode:endcode},success,fail);
	}

}