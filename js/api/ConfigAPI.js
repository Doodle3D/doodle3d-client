/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function ConfigAPI() {
	
	function loadAll(success,fail) {
		API.get('config/all',success,fail);
	};

	function load(key,success,fail) {
		API.get('config/?'+key+'=',success,fail)
	};

	function save(newSettings,success,fail) {
		API.post('config',{data:newSettings},success,fail);
	};
	
	function resetAll(success,fail) {
		API.post('config/resetall',{},success,fail)
	};

	function getSetting(key,success,fail) {
		API.get('config/?'+key+'=',function(response) {
			if (success) success(response[key]);
		},fail);
	}

	function getStartCode(success,fail) {
		loadAll(function(data) {
			var startcode = subsituteVariables(data['printer.startcode'],data);
			if (success) success(startcode);
		},fail);
	}

	function getEndCode(success,fail) {
		loadAll(function(data) {
			var endcode = subsituteVariables(data['printer.endcode'],data);
			if (success) success(endcode);
		},fail);
	}

	function subsituteVariables(gcode,settings) {
		//,temperature,bedTemperature,preheatTemperature,preheatBedTemperature
		var temperature 			      = settings["printer.temperature"];
		var bedTemperature 			    = settings["printer.bed.temperature"];
		var preheatTemperature      = settings["printer.heatup.temperature"];
		var preheatBedTemperature   = settings["printer.heatup.bed.temperature"];
	  var printerType             = settings["printer.type"];
	  var heatedbed             	= settings["printer.heatedbed"];

	  switch (printerType) {
	    case "makerbot_replicator2": printerType = "r2"; break; 
	    case "makerbot_replicator2x": printerType = "r2x"; break;
	    case "makerbot_thingomatic": printerType = "t6"; break;
	    case "makerbot_generic": printerType = "r2"; break;
	    case "_3Dison_plus": printerType = "r2"; break;
	  }
	  var heatedBedReplacement = (heatedbed)? "" : ";";

		gcode = gcode.replace(/{printingTemp}/gi  	,temperature);
		gcode = gcode.replace(/{printingBedTemp}/gi ,bedTemperature);
		gcode = gcode.replace(/{preheatTemp}/gi			,preheatTemperature);
		gcode = gcode.replace(/{preheatBedTemp}/gi 	,preheatBedTemperature);
	  gcode = gcode.replace(/{printerType}/gi     ,printerType);
	  gcode = gcode.replace(/{if heatedBed}/gi    ,heatedBedReplacement);
	    
		return gcode;
	}

	return {
		loadAll: loadAll,
		load: load,
		save: save,
		resetAll: resetAll,
		getSetting: getSetting,
		getStartCode: getStartCode,
		getEndCode: getEndCode,
	}
}