module.exports = function (grunt) {
    // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    auto_install: {
      local: {},
      options: {
        stdout: true,
        stderr: true,
        failOnError: true,
        recursive: true,
        exclude: ['.git', 'node_modules', 'components', 'grunt-tasks', 'bower_components', '.sass-cache']
      }
    }
  })

    // Load the plugin that provides the "uglify" task.
    // grunt.loadNpmTasks('grunt-contrib-uglify');

    // install bower deps
  grunt.loadNpmTasks('grunt-auto-install')

    // Default task(s).
  grunt.registerTask('default', ['auto_install'])
}
