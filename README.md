gulp-googlefonts-base64
===========

Gulp task for converting all Google Font URLs found within a stylesheet into base64-encoded data URI strings.

## Install

Install with [npm](https://npmjs.org) or [yarn](https://yarnpkg.org).

```console
$ npm install gulp-base64 --save-debug
$ yarn add gulp-base64 -D
```

## Example usage
```js
const gulp = require('gulp');
const base64 = require('gulp-googlefonts-base64');

gulp.task('build', () => {
  return gulp.src('./css/*.css')
    .pipe(base64())
    .pipe(concat('main.css'))
    .pipe(gulp.dest('./public/css'));
});
```

## debug

Debug can be enabled by adding `DEBUG=gulp-googlefonts-base64` before your script.
e.g. `DEBUG=gulp-googlefonts-base64 node ./index.js`
