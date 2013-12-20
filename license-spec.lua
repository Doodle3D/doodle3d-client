local M = {
	BASE_PATH = 'js_src',
	EXCLUDE_FILES = {},
	PROCESS_FILES = {
		['js_src/[^/]*%.js'] = 'cstyle'
	},
	IGNORE_GIT_CHANGED = false
}
return M
