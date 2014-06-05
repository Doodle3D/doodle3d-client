/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

function NetworkPanel() {
	
	var NOT_CONNECTED = "not connected"; // used as first item in networks list
	
	// network mode
	NetworkPanel.NETWORK_MODE = {
		NEITHER: "neither",
		CLIENT: "clientMode",
		ACCESS_POINT: "accessPointMode"
	};
	var _networkMode = NetworkPanel.NETWORK_MODE.NEITHER;
	var _networkModeChangedHandler;
	
	var _form = new FormPanel();
	var _api = new NetworkAPI();
	var _networks = {};
	var _currentNetwork;					// the ssid of the network the box is on
	var _selectedNetwork;         // the ssid of the selected network in the client mode settings
	var _substituted_ssid;				// the substituted ssid (displayed during creation)
	var _currentLocalIP = "";
	var _currentAP;
	var _currentNetworkStatus;
	
	var _retryDelay = 2000;
	//var _retryRefreshNetworksDelay;
	var _retryRetrieveStatusDelayTime = 1000;
	var _retryRetrieveStatusDelay;
	// after switching wifi network or creating a access point we delay the status retrieval
	// because the webserver needs time to switch
	var _retrieveNetworkStatusDelayTime = 1000;
	var _retrieveNetworkStatusDelay;
	
	// ui elements
	var _element;
	var _networkSelector;
	var _apFieldSet;
	var _clientFieldSet;
	var _apRadioButton;
	var _clientRadioButton;
	var _btnRefresh
	var _btnConnect;
	var _btnCreate;
	var _passwordField;
	var _passwordLabel;
	var _clientStateDisplay;
	var _apModeStateDisplay;
	
	var _self = this;
	
	this.init = function(wifiboxURL,wifiboxCGIBinURL,panelElement) {
		//console.log("NetworkPanel:init");
		
		_form.init(wifiboxURL,wifiboxCGIBinURL,panelElement)
		
		_api.init(wifiboxURL,wifiboxCGIBinURL);
		
		_element = panelElement;
		_apRadioButton			= _element.find("#ap");
		_clientRadioButton	= _element.find("#client");
		_btnRefresh		 			= _element.find("#refreshNetworks");
		_btnConnect 				= _element.find("#connectToNetwork");
		_btnCreate 					= _element.find("#createAP");
		_networkSelector 		= _element.find("#network");
		_apFieldSet 				= _element.find("#apSettings");
		_clientFieldSet 		= _element.find("#clientSettings");
		_passwordField 			= _element.find("#password");
		_passwordLabel 			= _element.find("#passwordLabel");
		_clientStateDisplay = _element.find("#clientModeState");
		_apModeStateDisplay = _element.find("#apModeState");
		
		_apRadioButton.parent().on('touchstart mousedown',showAPSettings);
		_clientRadioButton.parent().on('touchstart mousedown',showClientSettings);
		_btnRefresh.on('touchstart mousedown',onRefreshClick);
		_btnConnect.on('touchstart mousedown',_self.connectToNetwork);
		_btnCreate.on('touchstart mousedown',_self.createAP);
		_networkSelector.change(networkSelectorChanged);
	}
	/*
	 * Handlers
	 */
	function showAPSettings() {
		_apFieldSet.show();
		_clientFieldSet.hide();
	};
	function showClientSettings() {
		_clientFieldSet.show();
		_apFieldSet.hide();
	};
	function onRefreshClick() {
		_btnRefresh.attr("disabled", true);
		_self.refreshNetworks(function() {
			_btnRefresh.removeAttr("disabled");
		})
	}
	function networkSelectorChanged(e) {
		var selectedOption = $(this).find("option:selected");
		_self.selectNetwork(selectedOption.val());
	};

	this.update = function() {
		//console.log("NetworkPanel:update");
		_self.refreshNetworks();
		_self.retrieveNetworkStatus(false);
	}
	this.refreshNetworks = function(completeHandler) {
		//console.log("NetworkPanel:refreshNetworks");
		_api.scan(function(data) { // completed
			//console.log("NetworkPanel:scanned");
			_networks = {};
			var foundCurrentNetwork = false;
			// fill network selector
			_networkSelector.empty();
			_networkSelector.append(
					$("<option></option>").val(NOT_CONNECTED).html(NOT_CONNECTED)
			);
			$.each(data.networks, function(index,element) {
				if(element.ssid == _currentNetwork) {
					foundCurrentNetwork = true;
				}
				_networkSelector.append(
						$("<option></option>").val(element.ssid).html(element.ssid)
				);
				_networks[element.ssid] = element;
			});
			if(foundCurrentNetwork) {
				_networkSelector.val(_currentNetwork);
				_self.selectNetwork(_currentNetwork);
			}
			if(completeHandler) completeHandler();
		}/*,
		function() { // failed
			clearTimeout(_retryRefreshNetworksDelay);
			_retryRetrieveStatusDelay = setTimeout(function() { _self.refreshNetworks(completeHandler); },_retryDelay); // retry after delay
		}*/);
	};
	
	this.retrieveNetworkStatus = function(connecting) {
		//console.log("NetworkPanel:retrieveNetworkStatus");
		_api.status(function(data) {
			if(data.status === "") {
				data.status = NetworkAPI.STATUS.CREATED.toString();
			}
			if(typeof data.status === 'string') {
				data.status = parseInt(data.status);
			}
			//console.log("NetworkPanel:retrievedStatus status: ",data.status,data.statusMessage);
			
			// if status changed
			if(data.status != _currentNetworkStatus) {
				// Determine which network mode ui to show
				switch(data.status) {
					case NetworkAPI.STATUS.NOT_CONNECTED:
						setNetworkMode(NetworkPanel.NETWORK_MODE.NEITHER);
						break;
					case NetworkAPI.STATUS.CONNECTING_FAILED:
					case NetworkAPI.STATUS.CONNECTING:
					case NetworkAPI.STATUS.CONNECTED:
						setNetworkMode(NetworkPanel.NETWORK_MODE.CLIENT);
						break;
					case NetworkAPI.STATUS.CREATING:
					case NetworkAPI.STATUS.CREATED:
						setNetworkMode(NetworkPanel.NETWORK_MODE.ACCESS_POINT);
						break;
				}
				// update info
				switch(data.status) {
					case NetworkAPI.STATUS.CONNECTED:
						_currentNetwork = data.ssid;
						_currentLocalIP = data.localip;
						_self.selectNetwork(data.ssid);
						break;
					case NetworkAPI.STATUS.CONNECTING_FAILED:
					case NetworkAPI.STATUS.CONNECTING:
						_currentLocalIP = "";
						break;
					case NetworkAPI.STATUS.CREATING:
					case NetworkAPI.STATUS.CREATED:					
						_currentNetwork = undefined;
						_self.selectNetwork(NOT_CONNECTED);
						if(data.ssid && data.status == NetworkAPI.STATUS.CREATED) {
							_currentAP = data.ssid;
						}
						break;
				}
				// update ui 
				updateClientModeUI(data.status,data.statusMessage);
				updateAPModeUI(data.status,"");
			}

			// Keep checking for updates?
			if(connecting) {
				switch(data.status) {
				case NetworkAPI.STATUS.CONNECTING:
				case NetworkAPI.STATUS.CREATING:
					clearTimeout(_retryRetrieveStatusDelay);
				  _retryRetrieveStatusDelay = setTimeout(function() { _self.retrieveNetworkStatus(connecting); },_retryRetrieveStatusDelayTime); // retry after delay
					break;
				}
			}
			_currentNetworkStatus = data.status;
		}, function() {
			//console.log("NetworkPanel:retrieveStatus failed");
			clearTimeout(_retryRetrieveStatusDelay);
			_retryRetrieveStatusDelay = setTimeout(function() { _self.retrieveNetworkStatus(connecting); }, _retryRetrieveStatusDelayTime); // retry after delay
		});
	};
	function setNetworkMode(mode) {
		//console.log("NetworkPanel:setNetworkMode: ",_networkMode,">",mode);
		if(mode == _networkMode) return;
		switch(mode) {
			case NetworkPanel.NETWORK_MODE.NEITHER:
				_apFieldSet.show();
				_clientFieldSet.show();
				break;
			case NetworkPanel.NETWORK_MODE.CLIENT:
				_clientRadioButton.prop('checked',true);
				_apFieldSet.hide();
				_clientFieldSet.show();
				break;
			case NetworkPanel.NETWORK_MODE.ACCESS_POINT:
				_apRadioButton.prop('checked',true);
				_apFieldSet.show();
				_clientFieldSet.hide();
				break;
		}
		_networkMode = mode;
		if(_networkModeChangedHandler) _networkModeChangedHandler(_networkMode);
	}
	
	this.selectNetwork = function(ssid) {
		//console.log("NetworkPanel:selectNetwork: ",ssid);
		if(ssid == "") return;
		_selectedNetwork = ssid;

		var network = _networks[ssid];
		if(network === undefined || network.encryption == "none") {
			_passwordLabel.hide();
			_passwordField.hide();
		} else {
			_passwordLabel.show();
			_passwordField.show();
		}
		_passwordField.val("");
	};
	
	function updateClientModeUI(state,statusMessage) {
		//console.log("NetworkPanel:updateClientModeUI ",state,statusMessage);
		var msg = "";
		switch(state) {
			case NetworkAPI.STATUS.NOT_CONNECTED:
			case NetworkAPI.STATUS.CREATING:
			case NetworkAPI.STATUS.CREATED:
				_btnConnect.removeAttr("disabled");
				msg = "Not connected";
				_networkSelector.val(NOT_CONNECTED);
				break;
			case NetworkAPI.STATUS.CONNECTED:
				_btnConnect.removeAttr("disabled");
				msg = "Connected to: <b>"+_currentNetwork+"</b>.";
				if(_currentLocalIP != undefined && _currentLocalIP != "") {
					var a = "<a href='http://"+_currentLocalIP+"' target='_black'>"+_currentLocalIP+"</a>";
					msg += " (IP: "+a+")";
				}
				_networkSelector.val(_currentNetwork);
				break;
			case NetworkAPI.STATUS.CONNECTING:
				_btnConnect.attr("disabled", true);
				msg = "Connecting... Reconnect by connecting your device to <b>"+_selectedNetwork+"</b> and going to <a href='http://connect.doodle3d.com'>connect.doodle3d.com</a>";
				break;
			case NetworkAPI.STATUS.CONNECTING_FAILED:
				_btnConnect.removeAttr("disabled");
				msg = statusMessage;
				break;
		}
		//console.log("  client display msg: ",msg);
		_clientStateDisplay.html(msg);
	};
	function updateAPModeUI(state,statusMessage) {
		var msg = "";
		switch(state) {
			case NetworkAPI.STATUS.CONNECTING_FAILED:
			case NetworkAPI.STATUS.NOT_CONNECTED:
			case NetworkAPI.STATUS.CONNECTING:
			case NetworkAPI.STATUS.CONNECTED:
				_btnCreate.removeAttr("disabled");
				msg = "Not currently a access point";
				break;
			case NetworkAPI.STATUS.CREATED:
				_btnCreate.removeAttr("disabled");
				msg = "Is access point: <b>"+_currentAP+"</b>";
				break;
			case NetworkAPI.STATUS.CREATING:
				_btnCreate.attr("disabled", true);
				msg = "Creating access point... Reconnect by connecting your device to <b>"+_substituted_ssid+"</b> and going to <a href='http://draw.doodle3d.com'>draw.doodle3d.com</a>";
				break;
		}
		//console.log("  ap display msg: ",msg);
		_apModeStateDisplay.html(msg);
	};

	this.connectToNetwork = function() {
		//console.log("NetworkPanel:connectToNetwork");
		if(_selectedNetwork == undefined) return;
		// save network related settings and on complete, connect to network
		_form.saveSettings(_form.readForm(),function(validated, data) {
			if(!validated) return;
			updateClientModeUI(NetworkAPI.STATUS.CONNECTING,"");
			_api.associate(_selectedNetwork,_passwordField.val(),true);
			
			// after switching wifi network or creating a access point we delay the status retrieval
			// because the webserver needs time to switch it's status
			clearTimeout(_retrieveNetworkStatusDelay);
			_retrieveNetworkStatusDelay = setTimeout(function() { _self.retrieveNetworkStatus(true); }, _retrieveNetworkStatusDelayTime);
		});
	};

	this.createAP = function() {
		//console.log("createAP");
		// save network related settings and on complete, create access point
		_form.saveSettings(_form.readForm(),function(validated, data) {
			if(!validated) return;
			_substituted_ssid = data.substituted_ssid;
			updateAPModeUI(NetworkAPI.STATUS.CREATING,""); 
			_api.openAP();

			// after switching wifi network or creating a access point we delay the status retrieval
			// because the webserver needs time to switch it's status
			clearTimeout(_retrieveNetworkStatusDelay);
			_retrieveNetworkStatusDelay = setTimeout(function() { _self.retrieveNetworkStatus(true); }, _retrieveNetworkStatusDelayTime);
		});
	};
	
	this.setNetworkModeChangedHandler = function(handler) {
		_networkModeChangedHandler = handler;
	}
}
