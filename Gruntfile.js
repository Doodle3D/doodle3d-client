/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    concat: {
      options: {
//         separator: ';'
      },
      dist: {
        src: [
          'www/js/SettingsWindow.js',
          'www/js/d3dServerInterfacing.js',
          'www/js/verticalShapes.js',
          'www/js/buttonbehaviors.js',
          'www/js/canvasDrawing.js',
          'www/js/previewRendering.js',
          'www/js/gcodeGenerating.js',
          'www/js/init_layout.js',
          'www/js/Printer.js',
          'www/js/Progressbar.js',
          'www/js/Thermometer.js',
          'www/js/utils.js',
          'www/js/sidebar.js',
          'www/js/message.js',
          'www/js/main.js'
        ],
        dest: 'www/js/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
//        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: false,
        beautify: false,
        compress: {},
        report: 'min',
        preserveComments: 'false'
      },
      build: {
        src: ['www/js/*.js', '!www/js/<%= pkg.name %>.min.js'],
        dest: 'www/js/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      options: {
        globals: {
          jQuery: true
        },
        browser: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true
      },
//      gruntfile: {
//        src: 'Gruntfile.js'
//      },
      lib_test: {
        src: ['www/js/*.js', '!www/js/<%= pkg.name %>.js', '!www/js/<%= pkg.name %>.min.js']
      }
    },
    less: {
      development: {
        options: {
          paths: ["www/css"]
        },
        files: {
          "www/css/styles.css": "less/styles.less"
        }
      }
    },
    watch: {
//      javascript: {
//        files: ["www/js/*", '!www/js/*.min.js'],
//        //        tasks: ["less", "css_prefix"]
//        tasks: ["uglify"]
//      },
      styles: {
        files: ["less/*"],
        tasks: ["less", "autoprefixer", "cssmin"]
      }
    },
    autoprefixer: {
      options: {
        browsers: ['> 1%', 'last 2 versions', 'ie 8', 'ie 9', 'ff 17', 'opera 12.1']
      },
      // prefix all specified files and save them separately
      single_file: {
        options: {},
        //        expand: true,
        //        flatten: true,
        src: 'www/css/styles.css', // -> src/css/file1.css, src/css/file2.css
        dest: 'www/css/styles.css' // -> dest/css/file1.css, dest/css/file2.css
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'www/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'www/css/',
        ext: '.min.css'
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task.
  grunt.registerTask('default', [
    'less',
    'autoprefixer',
    'cssmin',
//    'concat',
//    'uglify',
//    'jshint',
    'watch'
  ]);

};
