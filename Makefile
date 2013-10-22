################################################
# OpenWrt Makefile for Doodle3D Print3D driver #
################################################
include $(TOPDIR)/rules.mk

PKG_NAME := doodle3d-client
PKG_VERSION := 0.9.0
PKG_RELEASE := 1

PKG_BUILD_DIR := $(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/doodle3d-client
	SECTION:=mods
	CATEGORY:=Doodle3D
	TITLE:=Doodle3D web client
	DEPENDS:=
endef

define Package/doodle3d-client/description
	This package provides the Doodle3D web client, which interacts with the wifibox package using a REST API.
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) less $(PKG_BUILD_DIR)/
	$(CP) www $(PKG_BUILD_DIR)/
	$(CP) Gruntfile.js $(PKG_BUILD_DIR)/
	$(CP) README.md $(PKG_BUILD_DIR)/
	$(CP) ___settings.html $(PKG_BUILD_DIR)/
	$(CP) lesstocss.sh $(PKG_BUILD_DIR)/
	$(CP) package.json $(PKG_BUILD_DIR)/
endef

define Build/Compile
	npm install
	grunt less autoprefixer cssmin concat uglify
endef

define Package/doodle3d-client/install
	$(INSTALL_DIR) $(1)/www
	$(INSTALL_DIR) $(1)/www/css
	$(INSTALL_DIR) $(1)/www/img
	#$(INSTALL_DIR) $(1)/www/js
	$(INSTALL_DIR) $(1)/www/js/libs
	
	$(CP) $(PKG_BUILD_DIR)/www/favicon* $(1)/www/
	$(CP) $(PKG_BUILD_DIR)/www/index.html $(1)/www/
	$(CP) $(PKG_BUILD_DIR)/www/settings.html $(1)/www/
	
	$(CP) $(PKG_BUILD_DIR)/www/css/debug.min.css $(1)/www/css/
	$(CP) $(PKG_BUILD_DIR)/www/css/settings.min.css $(1)/www/css/
	$(CP) $(PKG_BUILD_DIR)/www/css/styles.min.css $(1)/www/css/
	
	$(CP) $(PKG_BUILD_DIR)/www/img/* $(1)/www/img/
	
	$(CP) $(PKG_BUILD_DIR)/www/js/doodle3d-client.min.js $(1)/www/js/
	$(CP) $(PKG_BUILD_DIR)/www/js/libs/* $(1)/www/js/libs/
	
	$(CP) $(PKG_BUILD_DIR)/www/library $(1)/www/
endef

$(eval $(call BuildPackage,doodle3d-client))
