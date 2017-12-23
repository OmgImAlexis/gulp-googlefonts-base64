const async = require('async');
const fetch = require('fetch-base64');
const debug = require('debug')('gulp-googlefonts-base64')

// Cache regex's
const rImages = /([\s\S]*?)(url\(([^)]+)\))(?!\s*[;,]?\s*\/\*\s*base64:skip\s*\*\/)|([\s\S]+)/img;
const rData = /^data:/;

/**
 * Takes an remote path and base64 encodes it.
 *
 * @param url Absolute url
 * @return A data URI string (mime type, base64, etc.) that a browser can interpret as a css file
 */
const base64 = async url => {
  url = (url.startsWith('//') ? url.replace('//', 'http://') : url);
  return new Promise(async resolve => {
    // Already base64 encoded?
    if (rData.test(url)) {
      return resolve({
        data: url,
        cacheable: false
      });
    }

    debug(`Encoding ${url}`);
    const [data] = await fetch.remote(url);

    return resolve({
      data,
      cacheable: true
    });
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
const encode = (file, opts, done) => {
  opts = opts || {};

  // Cache of already converted fonts
  const cache = {};

  // Shift args if no options object is specified
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  const src = file.contents.toString();
  let result = '';
  let group;

  async.whilst(() => {
    group = rImages.exec(src);
    return group !== null;
  }, async complete => {
    if (group[4] !== undefined) {
      debug('Already processed.');
      result += group[4];
      return complete();
    }

    // If there is url to be processed, then:
    //    group[1] will hold everything up to the url declaration
    //    group[2] will hold the complete url declaration (useful if no encoding will take place)
    //    group[3] will hold the contents of the url declaration
    //    group[4] will be undefined
    // if there is no other url to be processed, then group[1-3] will be undefined
    //    group[4] will hold the entire string
    result += group[1];

    const rawUrl = group[3].trim();
    const font = rawUrl.replace(/"/g, '');

    // See if this font was already processed before
    if (cache[font]) {
      console.error(`
        The font ${font} has already been encoded elsewhere in your stylesheet.
        I'm going to do it again, but it's going to make your stylesheet a lot larger than it needs to be.
      `);
      result += cache[font];
      return complete();
    }
    debug('processing %s', font);

    // Process the font and put it into the cache
    const {data, cacheable} = await base64(font).catch(() => {
      result += group[2];
      return complete();
    });
    const url = `url("data:text/css;charset=utf-8;base64,${data}")`;
    result += url;

    if (cacheable !== false) {
      cache[font] = url;
    }

    return complete();
  }, () => {
    done(null, result);
  });
};

module.exports = encode;
