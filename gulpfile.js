var gulp = require('gulp');
var postcss = require('gulp-postcss');
var jade = require('gulp-jade');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var Duo = require('duo');
var plumber = require('gulp-plumber');
var through = require('through2');
var map = require('map-stream');


// POSTCSS Plugins
var autoprefixer = require('autoprefixer-core');
var cssnext = require('cssnext');
var mqpacker = require('css-mqpacker');
var lost = require('lost');
var bemLinter = require('postcss-bem-linter');
var postEasing = require('postcss-easings');
var postFocus = require('postcss-focus');
var hexrgba = require('postcss-color-alpha');

// browserify
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var riotify = require('riotify');
var uglify = require('gulp-uglify');
var notify = require('gulp-notify');

// Deploy
var ghPages = require('gulp-gh-pages');
var uglify = require('gulp-uglify');
var csso = require('gulp-csso');


gulp.task('default',['css','jade','browserify','watchify','browser-sync'], function() {
    gulp.watch('./index.css', ['css']);
    gulp.watch('./css/**/*.css', ['css']);
    gulp.watch('./pages/**/*.jade', ['jade']);
    //gulp.watch('./pages/views/**/*.jade', ['jade']);
    //gulp.watch('./index.js', ['JS']);
    //gulp.watch('./js/**/*', ['JS']);
});



/**
 * Compile CSS File
 */

gulp.task('css', function() {
    var processor = [
        bemLinter(),
        postEasing(),
        postFocus(),
        hexrgba(),
        cssnext(),
        lost(),
        autoprefixer({browsers: ['last 3 version']}),
        mqpacker()

    ];

    return gulp.src('./index.css')

        //.pipe(duoTask())
        .pipe(postcss(processor))
        .pipe(plumber.stop())
        .pipe(gulp.dest('./build/'))
        .pipe(reload({stream:true}))
});


/**
 * Compile HTML File
 */

// Function Jade
gulp.task('jade', function() {
    return gulp.src('./pages/*.jade')
        .pipe(jade({
            pretty: true
        }))
        .pipe(gulp.dest('./build/'))
        .pipe(reload({stream:true}))
});



/**
 * Compile JS File
 */

// Function Javascript Compile witg duojs

// build with browserify
gulp.task('browserify', function() {
    return browserify({
        debug: true,
        entries: ['./index.js'],
        transform: [riotify]
    })
        .bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./build'))
});

gulp.task('watchify', function() {
    var bundler = watchify(browserify('./index.js', watchify.args));

    function rebundle() {
        return bundler
            .bundle()
            .on('error', notify.onError())
            .pipe(source('app.js'))
            .pipe(gulp.dest('./build/'))
            .pipe(reload({stream: true}));
    }

    bundler.transform(riotify)
        .on('update', rebundle);
    return rebundle();
});





// Function Browser-sync reload
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: './build/'
        }
    });
});

// DUO Function
// function duoTask() {
//     return through.obj(function (file, enc, done) {
//         var    build = new Duo(__dirname);
//         build.development(true);
//         build.entry(file.path);
//         build.run(function (err, results) {
//             if (err) {
//                 return done(err);
//             }
//             file.contents = new Buffer(results.code, 'utf8');
//             return done(null, file);
//         });
//     });
// }

function duoTask(opts) {
  opts = opts || {};

  return map(function(file, fn) {
    Duo(file.base)
      .entry(file.path)
      .run(function(err, results) {
        if (err) return fn(err);
        file.contents = new Buffer(results.code);
        fn(null, file);
      });
  });
}