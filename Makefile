################################################
# OpenWrt Makefile for Doodle3D Print3D driver #
################################################
include $(TOPDIR)/rules.mk

PKG_NAME := doodle3d-client
PKG_VERSION := 0.9.3
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

define Package/doodle3d-client/config
	config DOODLE3D_CLIENT_MINIFY_JS
		depends on PACKAGE_doodle3d-client
		bool "Minify javascript"
		default y
		help
			All javascript files are concatenated into one file; this file enables minification
			of that file. Disable this to make on-the-fly modifications easier.
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) less $(PKG_BUILD_DIR)/
	$(CP) www $(PKG_BUILD_DIR)/
	$(CP) Gruntfile.js $(PKG_BUILD_DIR)/
	$(CP) README.md $(PKG_BUILD_DIR)/
	$(CP) lesstocss.sh $(PKG_BUILD_DIR)/
	$(CP) package.json $(PKG_BUILD_DIR)/
endef

define Build/Compile
	# We're cd'in into the build dir manually so it
	# runs these in the build dir, instead of the
	# shared customfeeds folder
	cd $(PKG_BUILD_DIR) && npm install
ifeq ($(CONFIG_DOODLE3D_CLIENT_MINIFY_JS),y)
	cd $(PKG_BUILD_DIR) && grunt less autoprefixer cssmin concat uglify
else
	cd $(PKG_BUILD_DIR) && grunt less autoprefixer cssmin concat
endif
endef

define Package/doodle3d-client/install

	$(INSTALL_DIR) $(1)/www
	$(INSTALL_DIR) $(1)/www/filemanager
	$(INSTALL_DIR) $(1)/www/css
	$(INSTALL_DIR) $(1)/www/img
	#$(INSTALL_DIR) $(1)/www/js
	$(INSTALL_DIR) $(1)/www/js/libs
	
	$(CP) $(PKG_BUILD_DIR)/www/favicon* $(1)/www/
	$(CP) $(PKG_BUILD_DIR)/www/index.html $(1)/www/
	$(CP) $(PKG_BUILD_DIR)/www/settings.html $(1)/www/
	$(CP) $(PKG_BUILD_DIR)/www/helpcontent.html $(1)/www/
	$(CP) $(PKG_BUILD_DIR)/www/redirect.html $(1)/www/
	$(CP) $(PKG_BUILD_DIR)/www/404.html $(1)/www/

	$(CP) $(PKG_BUILD_DIR)/www/css/debug.min.css $(1)/www/css/
	$(CP) $(PKG_BUILD_DIR)/www/css/settings.min.css $(1)/www/css/
	$(CP) $(PKG_BUILD_DIR)/www/css/styles.min.css $(1)/www/css/
	
	$(CP) $(PKG_BUILD_DIR)/www/img/* $(1)/www/img/
	$(CP) $(PKG_BUILD_DIR)/www/filemanager/* $(1)/www/filemanager/
	
ifeq ($(CONFIG_DOODLE3D_CLIENT_MINIFY_JS),y)
		$(CP) $(PKG_BUILD_DIR)/www/js/doodle3d-client.min.js $(1)/www/js/
else
		#NOTE: if using a symlink here installation with openwrt make fails
		#  when trying to build with minification after package has been built
		#  without minification (dangling symlink breaks openwrt's final copy command)
		$(CP) $(PKG_BUILD_DIR)/www/js/doodle3d-client.js $(1)/www/js/doodle3d-client.min.js
		#$(LN) -s /www/js/doodle3d-client.js $(1)/www/js/doodle3d-client.min.js
endif

	$(CP) $(PKG_BUILD_DIR)/www/js/libs/* $(1)/www/js/libs/
	
	$(CP) $(PKG_BUILD_DIR)/www/library $(1)/www/
endef

$(eval $(call BuildPackage,doodle3d-client))
