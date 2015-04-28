/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
 
function SketchAPI() {

	this.load = function(id,success,fail) {
		API.get('sketch/?id='+id,success,fail);
	}

  this.save = function(data,success,fail) {
    API.post('sketch',{data:data},success,fail);
  }

}