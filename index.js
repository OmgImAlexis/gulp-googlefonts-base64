const through = require('through2');
const encode = require('./lib/encode');

module.exports = opts => {
  function rebase(file, encoding, callback) {
    const self = this;
    encode(file, opts, (err, src) => {
      if (err) {
        console.error(err);
      }

      file.contents = Buffer.from(src);

      self.push(file);
      callback();
    });
  }

  return through.obj(rebase);
};
