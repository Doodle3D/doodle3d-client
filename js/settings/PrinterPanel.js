/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function PrinterPanel() {
	
	this.printerType;
	var _api = new PrinterAPI();
	var _form = new FormPanel();
	
	// ui elements
	var _element;
	var _printerSelector;
	var _printerSettings;
	
	var _self = this;
	
	this.init = function(wifiboxURL,wifiboxCGIBinURL,panelElement) {
		
		_form.init(wifiboxURL,wifiboxCGIBinURL,panelElement)
		_api.init(wifiboxURL,wifiboxCGIBinURL);
		_element = panelElement;
		_printerSelector 	= _element.find("#printerType");
		_printerSelector.change(_self.printerSelectorChanged);
		
		// we use readForm to get all the settings we need to 
		// reload after changing printer type 
		_printerSettings = _form.readForm();
		
		var gcodePanel = _element.find("#gcodePanel");
		gcodePanel.coolfieldset({collapsed:true});
	}
	this.load = function(completeHandler) {
		
		_api.listAll(function(data) {
			$.each(data.printers, function(key, value) {
				// console.log(key,value);
				$('#printerType').append($('<option>').text(value).attr('value', key));
			});
			completeHandler();
		});
	}
	this.printerSelectorChanged = function(e) {
		_self.printerType = _printerSelector.find("option:selected").val();
		var settings = {}; 
		settings[_printerSelector.attr("name")] = _self.printerType;
		
		_form.saveSettings(settings,function(validated) {
			if(!validated) return;
			_form.loadSettings(_printerSettings,function(settings) {
				_form.fillForm(settings);
			});
		});
	}
}
