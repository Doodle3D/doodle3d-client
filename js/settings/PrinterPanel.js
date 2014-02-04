/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

// prototype inheritance 
// http://robertnyman.com/2008/10/06/javascript-inheritance-how-and-why/
PrinterPanel.prototype = new FormPanel();
function PrinterPanel() {
	
	this.printerType;
	
	// ui elements
	var _element;
	var _printerSelector;
	var _printerSettings;
	
	var _self = this;

	this.init = function(wifiboxURL,wifiboxCGIBinURL,panelElement) {
		
		// super call:
		_self.constructor.prototype.init.call(_self,wifiboxURL,wifiboxCGIBinURL,panelElement);
		
		_element = panelElement;
		
		_printerSelector 	= _element.find("#printerType");
		_printerSelector.change(_self.printerSelectorChanged);
		
		// we use readForm to get all the settings we need to 
		// reload after changing printer type 
		_printerSettings = _self.readForm();
		
		var gcodePanel = _element.find("#gcodePanel");
		gcodePanel.coolfieldset({collapsed:true});
	}
	this.printerSelectorChanged = function(e) {
		_self.printerType = _printerSelector.find("option:selected").val();
		var settings = {}; 
		settings[_printerSelector.attr("name")] = _self.printerType;
		
		_self.saveSettings(settings,function(validated) {
			if(!validated) return;
			_self.loadSettings(_printerSettings,function(settings) {
				_self.fill(settings);
			});
		});
	}
}
