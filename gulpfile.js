"use strict";

// Load plugins
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const del = require("del");
const gulp = require("gulp");
const glob = require('glob');
const header = require("gulp-header");
const merge = require("merge-stream");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');
var fs = require("fs");
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var connect = require('gulp-connect');
const debounce = require('gulp-debounce');
const watch = require('gulp-debounced-watch')
const log = require('fancy-log')
const newer = require('gulp-newer');
// var nunjucks = require('./js/app/infra/nunjucks');
var nunjucks = require('nunjucks');
var gnunjucks = require('gulp-nunjucks');
var config = require('./config')

// Load package.json for banner
const pkg = require('./package.json');

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/StartBootstrap/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');



// BrowserSync
function browserSync(done) {
  return browsersync.init({
    // proxy: config.PROXY,
    // host: config.HOST,
    // open: 'external',
    server: {
      baseDir: config.DESTINATION_PATH
    },
    port: process.env.PORT || 333
  });
  done();
}
let IS_RUNNING = {
  js: false,
  css: false,
  njk: false
}
// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload({stream: true});
  
  done();
}

// Clean vendor
function clean() {
  return del(config.DESTINATION_PATH + '/**', {force:true});
}

// Bring third party dependencies from node_modules into vendor directory
function modules(cb) {
  var list_modules = {
    bootstrapJS: {
      source: './node_modules/bootstrap/dist/js/*',
      dest: config.DESTINATION_PATH+'/vendor/bootstrap/js'
    },
    bootstrapSCSS: {
      source: './node_modules/bootstrap/scss/**/*',
      dest: config.DESTINATION_PATH+'/vendor/bootstrap/scss',
    },
    chartJS: {
      source: './node_modules/chart.js/dist/*.js',
      dest: config.DESTINATION_PATH+'/vendor/chart.js'
    },
    dataTables: {
      source: [
        './node_modules/datatables.net/js/*.js',
        './node_modules/datatables.net-bs4/js/*.js',
        './node_modules/datatables.net-bs4/css/*.css'
      ],
      dest: config.DESTINATION_PATH+'/vendor/datatables'
    },
    fontAwesome: {
      source: './node_modules/@fortawesome/**/*',
      dest: config.DESTINATION_PATH+'/vendor',
    },
    jqueryEasing: {
      source: './node_modules/jquery.easing/*.js',
      dest: config.DESTINATION_PATH+'/vendor/jquery-easing'
    },
    jquery: {
      source: [
        './node_modules/jquery/dist/*',
        '!./node_modules/jquery/dist/core.js'
      ],
      dest: config.DESTINATION_PATH+'/vendor/jquery',
    },
    touchDnd: {
      source: [
        './node_modules/touch-dnd/*',
      ],
      dest: config.DESTINATION_PATH+'/vendor/touch-dnd',
    },
    sweetalert2: {
      source: './node_modules/sweetalert2/dist/**/*',
      dest: config.DESTINATION_PATH+'/vendor/sweetalert2'
    },
    colorPicker: {
      source: './node_modules/spectrum-colorpicker/**/*',
      dest: config.DESTINATION_PATH+'/vendor/spectrum-colorpicker'
    },
    tinyColor: {
      source: './node_modules/tinycolor2/dist/**/*',
      dest: config.DESTINATION_PATH+'/vendor/tinycolor2'
    },
    videoRecord: {
      source: './node_modules/videojs-record/dist/**/*',
      dest: config.DESTINATION_PATH+'/vendor/videojs-record',
    },
    recordRtc: {
      source: './node_modules/recordrtc/**/*',
      dest: config.DESTINATION_PATH+'/vendor/recordrtc',
    },
    webRtcAdapter: {
      source: './node_modules/webrtc-adapter/out/**/*',
      dest: config.DESTINATION_PATH+'/vendor/webrtc-adapter',
    },
    videoJs: {
      source: './node_modules/video.js/dist/**/*',
      dest: config.DESTINATION_PATH+'/vendor/videojs'
    },
    jquerySortable: {
      source: './node_modules/jquery-sortablejs/**/*',
      dest: config.DESTINATION_PATH+'/vendor/jquery-sortablejs',
    },
    sortablejs: {
      source: './node_modules/sortablejs/**/*',
      dest: config.DESTINATION_PATH+'/vendor/sortablejs',
    },
    datePicker: {
      source: './node_modules/@chenfengyuan/datepicker/dist/**/*',
      dest: config.DESTINATION_PATH+'/vendor/datepicker',
    }
  }

  return merge(Object.keys(list_modules).map((moduleName) => {
    const moduleOpt = list_modules[moduleName];
    return gulp.src(moduleOpt.source)
    .pipe(newer(moduleOpt.dest))
      .pipe(gulp.dest(moduleOpt.dest))
  })).on('end', () => {
    console.log("TASK COMPLETE modules")
    cb();
  })
}

// CSS task
function css(args) {
  const fileName = typeof args == 'string' ? args : '';

  if(fileName) {
    console.log("checkpoint-1");
    log.info(`[BUILD] ${fileName}`)
  } else {
    console.log("checkpoint-2");
  }
  const sourceFile = fileName || ["./scss/**/*.scss", "./css/**/*.css"];
  return gulp
    .src(sourceFile)
    .pipe(newer(config.DESTINATION_PATH+"/css"))
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    // .pipe(gulp.dest("./css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(config.DESTINATION_PATH+"/css"))
    .pipe(browsersync.stream())
    .on('end', () => {
      if(typeof args == 'function') {
        console.log('TASK COMPLETE css')
        args();
      }
    });
}

// JS task
function js(args) {
  const fileName = typeof args == 'string' ? args : '';
  if(fileName) {
    log.info(`[BUILD] ${fileName}`)
  }
  const sourceFile = "./js/**/*.js";
  var files = glob.sync(sourceFile, {
    ignore: [
      './js/app/business_logic/**',
      './js/app/core/**',
      './js/app/data_proxy/**',
      './js/app/infra/**',
      './js/app/__mocks__/**',
      './js/app/tests/**',
    ]
  });
  return merge(files.map(function(file) {
    // var b = watchify(browserify(file)
    //   .transform("babelify", { presets: ['@babel/preset-env'] }));
    var b = (browserify(file)
      .transform("babelify", { presets: ['@babel/preset-env'] }));
    return b.bundle()
      .pipe(source(file))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config.DESTINATION_PATH));
  })).on('end', () => {
    if(typeof args == 'function') {
      console.log('TASK COMPLATE JS')
      args();
    }
  });

  
  
  
  // browserify({
  //   entries: jsFiles,
  //   debug: true,
  //   transform: [babelify.configure({
  //     presets: ['es2015']
  //   })]
  // });

  // return b.bundle()
  //   .pipe(uglify())
  //   .pipe(header(banner, {
  //     pkg: pkg
  //   }))
  //   .pipe(rename({
  //     suffix: '.min'
  //   }))
  //   .pipe(gulp.dest('./js'))
  //   .pipe(browsersync.stream());
}

// SERVE task
function serve() {
  console.log("check port");
  console.log(process.env.PORT);
  return connect.server({
    root: "./dist",
    port: process.env.PORT || 333, // localhost:8000
    livereload: false
  });
}

// Watch files
function watchFiles() {
  const options = {
    debounceTimeout: 1000,
    awaitWriteFinish: true
  }
  watch("./css/**/*", options).on('change', css);
  watch(["./js/**/*.js", "!./js/**/*.min.js"], options).on('change', js)
  // gulp.watch("./**/*.html", browserSyncReload);
  gulp.watch(config.VIEW_PATH+"**/*",options).on('change', compileNunjucks)
}

// Compile nunjucks file
function compileNunjucks(args) {
  const fileName = typeof args == 'string' ? args : '';
  if(fileName) {
    log.info(`[COMPILE] ${fileName}`)
  }
  var PAGE_PATH = config.PAGE_PATH;
  var opts = {
    env:  new nunjucks.Environment(new nunjucks.FileSystemLoader('js/app/views/'))
  }
  var extensions = '**/*.+(html|njk|nunj|nunjucks)';
  var listPath = [
    `${PAGE_PATH}${extensions}`,
    `!${PAGE_PATH}*/components/${extensions}`,
  ]

  const sourceFile = listPath
  
  return gulp.src(sourceFile)
  .pipe(newer(config.DESTINATION_PATH+'/**/*.html'))
  // .pipe(plumber())
  .pipe(gnunjucks.compile({version: '1.8'}, opts))
  .pipe(rename(function(path){
    if(path.dirname == 'home') {
      path.dirname = '.';
    }
  }))
  .pipe(gulp.dest(config.DESTINATION_PATH))
  .on('end', () => {
    if(typeof args == 'function') {
      console.log("TASK COMPLETE compile nunjuk")
      args();
    }
  });
}

// copy assets
function copyAssets(cb) {
  console.log("🚀 ~ file: gulpfile.js ~ line 289 ~ copyAssets ~ cb", cb)
  return gulp.src('./assets/**/*')
    .pipe(newer(config.DESTINATION_PATH+'/assets'))
    .pipe(gulp.dest(config.DESTINATION_PATH+'/assets'))
    .on('end', () => {
      console.log('TASK COMPLETE COPY ASSET')
      cb();
    });
}

// copy pwa
function copyPwa(cb) {
  const listSource = [
    './manifest.json',
    './serviceWorker.js'
  ];
  return gulp.src(listSource)
    .pipe(gulp.dest(config.DESTINATION_PATH))
    .on('end', () => {
      console.log('TASK COMPLETE COPY PWA')
      cb();
    });
}

// Define complex tasks
const build = gulp.series(modules, gulp.parallel(copyPwa, css, js, copyAssets, compileNunjucks));
// const watchCmd = gulp.series(build, gulp.parallel(watchFiles, browserSync));
const watchCmd = gulp.series(watchFiles);
const dev = gulp.parallel(watchFiles, serve);
// const dev = gulp.series(build, gulp.parallel(watchFiles, serve));
// const watch = gulp.series(watchFiles)

// Export tasks
exports.css = css;
exports.js = js;
exports.clean = clean;
// exports.vendor = vendor;
exports.build = build;
exports.watch = watchCmd;
exports.default = build;
exports.compile = compileNunjucks;
exports.serve = serve;
exports.dev = dev;
exports.copyPwa = copyPwa;
exports.copyAssets = copyAssets;
exports.modules = modules;
