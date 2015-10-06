'use strict';

var babelify = require("babelify");
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');

gulp.task('javascript', function () {
    // set up the browserify instance on a task basis
    var b = browserify({
        entries: './src/UniversalEvents.js',
        debug: true,
        standalone: 'UniversalEvents',
        transform: [babelify]
    });

    return b.bundle()
        .pipe(source('UniversalEvents.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/js/'));
});