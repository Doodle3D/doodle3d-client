local M = {
	BASE_PATH = 'js',
	EXCLUDE_FILES = {},
	PROCESS_FILES = {
		['js/[^/]*%.js'] = 'cstyle',
		['js/api/[^/]*%.js'] = 'cstyle',
		['js/settings/[^/]*%.js'] = 'cstyle'
	},
	IGNORE_GIT_CHANGED = false
}
return M
