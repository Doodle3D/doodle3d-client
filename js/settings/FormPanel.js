/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function FormPanel() {
	
	var _configAPI = new ConfigAPI();
	var _retryDelay = 2000;
	var _retrySaveSettingsDelay;
	// ui elements
	var _element;
	
	var _self;
	
	FormPanel.prototype.init = function(wifiboxURL,wifiboxCGIBinURL,panelElement) {
		console.log("FormPanel:init");
		// make _self the scope of which init was called?
		// needed to have the subclass instance access the same counter 
		_self = this; 
		_element = panelElement;
		//_configAPI.init(wifiboxURL,wifiboxCGIBinURL);
		
		console.log("  calling _self.readForm from FormPanel:init");
		_self.readForm();
		//console.log("  calling this.readForm from FormPanel:init");
		//this.readForm();
		//console.log("  calling _self2.readForm from FormPanel:init");
		//_self2.readForm();
	};
	
	//this.readForm = function(form) {
	FormPanel.prototype.readForm = function(form) {
		console.log("FormPanel:readForm");
		/*if(!form) form = _element; // if no form specified, read whole panel form
		//console.log("FormPanel");
		var settings = {};
		// Read all selects
		var selects = form.find("select");
		selects.each( function(index,element) {
			var elem = $(element);
			//var fieldName = elem.attr('name');
			if(elem.attr('name') != "") {
				settings[elem.attr('name')] = elem.val();
			}
		});
		// Read all inputs
		var inputs = form.find("input");
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
		// Read all textareas
		var textareas = form.find("textarea");
		textareas.each( function(index,element) {
			var elem = $(element);
			settings[elem.attr('name')] = elem.val();
		});
		console.log("  settings: ",settings);
		return settings;*/
	};
	
	/*this.fillForm = function(settings,form) { 
		console.log("FormPanel:fillForm");
		if(!form) form = _element; // if no form specified, fill whole panel form
		console.log("  settings: ",settings);
		console.log("  form: ",form);
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
		console.log("FormPanel:saveSettings");
		console.log("  newSettings: ",newSettings);
		console.log("  form: ",form);
		_configAPI.save(newSettings,function(data) {
			var validation = data.validation;
			console.log("  validation: ",validation);
			clearValidationErrors();
			var validated = true;
			$.each(validation, function(key, val) {
				if (val != "ok") {
					console.log("ERROR: setting '" + key + "' not successfully set. Message: " + val);
					displayValidationError(key,val);
					validated = false;
				}
			});
			settings.substituted_ssid = data.substituted_ssid;
			if(complete) complete(validated);
		}, function() {
			console.log("Settings:saveSettings: failed");
			clearTimeout(_retrySaveSettingsDelay);
			_retrySaveSettingsDelay = setTimeout(function() { _self.saveSettings(newSettings,complete); },_retryDelay); // retry after delay
		});
	};
	function displayValidationError(key,msg) {
		var formElement = _element.find("[name|='"+key+"']");
		formElement.addClass("error");
		var errorMsg = "<p class='errorMsg'>"+msg+"</p>";
		formElement.after(errorMsg);
	};
	function clearValidationErrors() {
		_element.find(".errorMsg").remove();
		_element.find(".error").removeClass("error");
	};*/
}
