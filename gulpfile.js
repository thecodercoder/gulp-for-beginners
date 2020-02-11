const { src, dest, watch, series, parallel } = require('gulp');

const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const combinemq = require('postcss-combine-media-query');
const cssnano = require('cssnano');

const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const del = require('del');
const imagemin = require('gulp-imagemin');
const replace = require('gulp-replace');
const browsersync = require('browser-sync').create();

function scssDevTask(){
    return src('app/scss/style.scss', { sourcemaps: true })
        .pipe(sass({ 
            includePaths: 'node_modules/@fortawesome'
        }))
        .pipe(postcss([autoprefixer()]))      
        .pipe(dest('dist', { sourcemaps: '.' }));
}

function scssProdTask(){
    return src('app/scss/style.scss', { sourcemaps: true })
        .pipe(sass({ 
            includePaths: 'node_modules/@fortawesome'
        }))
        .pipe(postcss([autoprefixer(), combinemq(), cssnano()]))      
        .pipe(dest('dist', { sourcemaps: '.' }));
}

function concatJsTask(){
    return src('app/js/*.js')
        .pipe(concat('scripts.js'))
        .pipe(dest('app/js'));
}

function browserifyTask(){
    return browserify('app/js/scripts.js')
        .bundle()
        .pipe(source('scripts.js'))
        .pipe(buffer())
        .pipe(dest('app/js'));
}

function jsDevTask(){
    return src(['app/js/scripts.js'], { sourcemaps: true })        
        .pipe(babel({ presets: ['@babel/preset-env']}))        
        .pipe(dest('dist', { sourcemaps: '.' }));
}

function jsProdTask(){
    return src(['app/js/scripts.js'], { sourcemaps: true })        
        .pipe(babel({ presets: ['@babel/preset-env']}))
        .pipe(uglify())
        .pipe(dest('dist', { sourcemaps: '.' }));
}

function cleanTask(){
    return del('app/js/scripts.js');
}

function imageminTask(){
    return src('img/*')
        .pipe(imagemin([
                imagemin.gifsicle({interlaced: true}),
                imagemin.mozjpeg({quality: 75, progressive: true}),
                imagemin.optipng({optimizationLevel: 5}),
                imagemin.svgo({
                    plugins: [
                        {removeViewBox: true},
                        {cleanupIDs: false}
                    ]
                })
            ], 
            { verbose: true }
        ))
        .pipe(dest('img'));
}

function cacheBustTask(){
    let cbNumber = new Date().getTime();
    return src('index.html')
        .pipe(replace(/cb=\d+/g, 'cb=' + cbNumber))
        .pipe(dest('.'));
}

function browserSyncServe(cb){
    browsersync.init({
        server: {
            baseDir: '.'
        }
    });
    cb();
}

function browserSyncReload(cb){
    browsersync.reload();
    cb();
}

function watchTask(){
    watch('index.html', browserSyncReload);
    watch([
            'app/scss/**/*.scss', 
            'app/js/**/*.js',
            '!app/js/scripts.js'
        ], 
        series(
            scssDevTask, 
            concatJsTask, 
            browserifyTask, 
            jsDevTask,
            cleanTask,
            cacheBustTask,
            browserSyncReload
        )
    );
    watch('img/*', series(imageminTask, browserSyncReload));
}

exports.default = series(
    scssDevTask, 
    concatJsTask, 
    browserifyTask, 
    jsDevTask,
    cleanTask,
    imageminTask,
    cacheBustTask,
    browserSyncServe,
    watchTask
);

exports.prod = series(
    scssProdTask, 
    concatJsTask, 
    browserifyTask, 
    jsProdTask,
    cleanTask,
    imageminTask,
    cacheBustTask
);