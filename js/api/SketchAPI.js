/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */
 
function SketchAPI() {
  var className = 'SketchAPI';

  function load(id,success,fail) {
		API.get('sketch/?id='+id,{},success,fail);
	}

  function list(success,fail) {
    API.get('sketch/list',{},success,fail); 
  }

  function save(data,success,fail) {
    console.log(className,'saving sketch',data);
    API.post('sketch',{data:data},success,fail);
  }

  function del(id,success,fail) {
    console.log(className,'deleting sketch',id);
    API.post('sketch/delete',{id:id},success,fail);
  }

  function status(success,fail) {
     API.get('sketch/status',{},success,fail);  
  }

  return {
    load: load,
    list: list,
    save: save,
    status: status,
    del: del,
  }

}