const {src, dest, task, series, watch, parallel} = require("gulp");
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const rm = require("gulp-rm");
const sass = require('gulp-sass')(require('sass'));
const gcmq = require("gulp-group-css-media-queries");
const browserSync = require("browser-sync").create();
const autoprefixer = require("gulp-autoprefixer");
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const sassGlob = require("gulp-sass-glob");
const pug = require("gulp-pug");
const gulpif = require("gulp-if");
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");

const {SRC_PATH, DIST_PATH} = require("./gulp.config.js");

const reload = browserSync.reload;
const env = process.env.NODE_ENV;
const envDev = env === "dev"
const envProd = env === "prod"

task("images", () => {
    return src(`${SRC_PATH}/images/**/*`)
        .pipe(dest(`${DIST_PATH}/images`))
        .pipe(reload({stream: true}));
});

task("fonts", () => {
    return src(`${SRC_PATH}/fonts/**/*`)
        .pipe(
            rename((path) => {
                path.basename = `${path.basename.toLowerCase()}`;
            })
        )
        .pipe(dest(`${DIST_PATH}/fonts`))
        .pipe(reload({stream: true}));
});

task('scripts', () => {
    return src(`${SRC_PATH}/scripts/**/*.js`)
        .pipe(concat("scripts.min.js"))
        .pipe(
            gulpif(
                envProd,
                babel({
                    presets: ["@babel/env"]
                })
            )
        )
        .pipe(gulpif(envProd, uglify()))
        .pipe(dest('dist'))
});

task("html", () => {
    return src(`${SRC_PATH}/pages/*.pug`)
        .pipe(pug())
        .pipe(dest(`${DIST_PATH}`))
        .pipe(reload({stream: true}));
});

task("styles", () => {
    return src([`${SRC_PATH}/styles/main.scss`])
        .pipe(gulpif(envDev, sourcemaps.init()))
        .pipe(sassGlob())
        .pipe(sass().on("error", sass.logError))
        .pipe(gulpif(envProd, gcmq()))
        .pipe(gulpif(envProd, cleanCSS()))
        .pipe(gulpif(envProd, autoprefixer()))
        .pipe(gulpif(envDev, sourcemaps.write()))
        .pipe(concat("styles.min.css"))
        .pipe(dest(`${DIST_PATH}`))
        .pipe(reload({stream: true}));
});

task("clean", () => {
    return src(`${DIST_PATH}/**/*`, {read: false}).pipe(rm());
});

task("server", () => {
    browserSync.init({
        server: {
            baseDir: `${DIST_PATH}`
        }
    });
});
task("watch", () => {
    watch(`${SRC_PATH}/images/**/*`, series("images")).on("change", reload);
    watch(`${SRC_PATH}/fonts/**/*`, series("fonts")).on("change", reload);
    watch(`${SRC_PATH}/pages/**/*.pug`, series("html")).on("change", reload);
    watch(`${SRC_PATH}/styles/**/*.scss`, series("styles")).on("change", reload);
    watch(`${SRC_PATH}/scripts/**/*.js`, series("scripts")).on("change", reload);
});

task(
    "dev",
    series(
        parallel("images", "fonts", "html", "styles", "scripts"),
        parallel("watch", "server")
    )
);

task(
    "prod",
    series(
        "clean",
        parallel("images", "fonts", "html", "styles", "scripts")
    )
);