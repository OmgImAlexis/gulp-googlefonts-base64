const async = require('async');
const fetch = require('./fetch');

// Cache regex's
const rImages = /([\s\S]*?)(url\(([^)]+)\))(?!\s*[;,]?\s*\/\*\s*base64:skip\s*\*\/)|([\s\S]+)/img;
const rData = /^data:/;

/**
 * Base64 encodes an image and builds the data URI string
 *
 * @param file The source path
 * @return Data URI string
 */
const getDataURI = file => `data:text/css;charset=utf-8;base64,${file.toString('base64')}`;

/**
 * Takes an remote path and base64 encodes it.
 *
 * @param url Absolute url path
 * @param opts Options object
 * @return A data URI string (mime type, base64, etc.) that a browser can interpret as a css file
 */
const image = function (img, opts, done) {
  // Shift args
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  // Set default, helper-specific options
  Object.assign(opts, {
    maxImageSize: 32768
  }, opts);

  const complete = (err, encoded, cacheable) => {
    // Too long?
    if (cacheable && encoded && opts.maxImageSize && encoded.length > opts.maxImageSize) {
      err = 'Skipping ' + img + ' (greater than ' + opts.maxImageSize + ' bytes)';
    }

    // Return the original source if an error occurred
    if (err) {
      return done(err, img, false);
    }

    // Otherwise cache the processed image and return it
    return done(null, encoded, cacheable);
  };

  // Already base64 encoded?
  if (rData.test(img)) {
    return complete(null, img, false);
  }

  console.log(`Encoding file: ${img}`);
  fetch.image(img, (err, src, cacheable) => {
    let encoded;
    if (err === null) {
      encoded = getDataURI(src);
    }
    return complete(err, encoded, cacheable);
  });
};

/**
 * Takes a CSS file as input, goes through it line by line, and base64
 * encodes any Google fonts it finds.
 *
 * @param srcFile Relative or absolute path to a source stylesheet file.
 * @param opts Options object
 * @param done Function to call once encoding has finished.
 */
const stylesheet = (file, opts, done) => {
  opts = opts || {};

  // Cache of already converted images
  const cache = {};

  // Shift args if no options object is specified
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  const src = file.contents.toString();
  let result = '';
  let img;
  let group;

  async.whilst(() => {
    group = rImages.exec(src);
    return group !== null;
  }, complete => {
    // If there is another url to be processed, then:
    //    group[1] will hold everything up to the url declaration
    //    group[2] will hold the complete url declaration (useful if no encoding will take place)
    //    group[3] will hold the contents of the url declaration
    //    group[4] will be undefined
    // if there is no other url to be processed, then group[1-3] will be undefined
    //    group[4] will hold the entire string

    if (group[4] === undefined) {
      result += group[1];

      const rawUrl = group[3].trim();
      img = rawUrl.replace(`"`, '');
      console.log('processing %s', img);

      // See if this font was already processed before
      if (cache[img]) {
        console.error(`
          The image ${img} has already been encoded elsewhere in your stylesheet.
          I'm going to do it again, but it's going to make your stylesheet a lot larger than it needs to be.
        `);
        result += cache[img];
        complete();
      } else {
        // Process it and put it into the cache
        const loc = img;

        image(loc, opts, (err, resp, cacheable) => {
          if (err === null) {
            const url = 'url(' + resp + ')';
            result += url;

            if (cacheable !== false) {
              cache[img] = url;
            }
          } else {
            result += group[2];
          }

          complete();
        });
      }
    } else {
      console.log('Already processed.');
      result += group[4];
      complete();
    }
  }, () => {
    done(null, result);
  });
};

module.exports = {
  stylesheet,
  getDataURI
};
