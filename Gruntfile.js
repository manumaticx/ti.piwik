module.exports = function(grunt) {

  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    jshint : {
      options : {
        jshintrc : true
      },
      src : ['Gruntfile.js', 'src/*.js']
    },
    mochaTest : {
      options : {
        timeout : 3000,
        reporter : 'spec'
      },
      src : ['test/*.js']
    },
    copy : {
      main : {
        nonull : true,
        files : [{
          src : 'src/ti.piwik.js',
          dest : 'build/ti.piwik.uncompressed.js',
        }, {
          src : 'README.md',
          dest : 'documentation/index.md',
        }]
      },
    },
    uglify : {
      options : {
        banner : '/* <%= pkg.name %> <%= pkg.version %> \n' + ' * <%= pkg.description %>\n' + ' * (c) <%= grunt.template.today("yyyy") %> <%= pkg.organization %>\n' + ' */\n'
      },
      dist : {
        files : {
          'build/ti.piwik.js' : ['build/ti.piwik.uncompressed.js']
        }
      }
    },
    compress : {
      main : {
        options : {
          archive : '<%= pkg.name %>-commonjs-<%= pkg.version %>.zip'
        },
        files : [{
          expand : true,
          src : ['build/ti.piwik.js', 'LICENSE', 'manifest'],
          dest : 'modules/commonjs/<%= pkg.name %>/<%= pkg.version %>/',
          filter : 'isFile',
          flatten : true
        }, {
          src : ['documentation/*', 'example/*'],
          dest : 'modules/commonjs/<%= pkg.name %>/<%= pkg.version %>/'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('version', 'update version from package.json', function() {

    // read files
    var version = grunt.file.readJSON('package.json').version;
    var manifest = grunt.file.read('manifest');
    var readme = grunt.file.read('README.md');

    // update manifest
    grunt.file.write('manifest', manifest.replace(/^version.*$/m, "version: " + version));

    // update readme
    grunt.file.write('README.md', readme.replace(/gittio-[\d\.]{2,}-00B4CC\.svg/g, "gittio-" + version + "-00B4CC.svg"));

  });

  grunt.registerTask('build', ['copy', 'uglify', 'compress', 'version']);
  grunt.registerTask('test', ['jshint', 'mochaTest']);
  grunt.registerTask('default', ['test', 'build']);

};
