const through = require('through2');
const encode = require('./lib/encode');

module.exports = function (opts) {
  function rebase(file, encoding, callback) {
    encode.stylesheet(file, opts, (err, src) => {
      if (err) {
        console.error(err);
      }

      file.contents = Buffer.from(src);

      this.push(file);
      callback();
    });
  }

  return through.obj(rebase);
};
