const stream = require('stream');
const request = require('request');
const buffers = require('buffers');

/**
 * Fetches a remote image.
 *
 * @param url Remote path, like http://url.to/an/image.png
 * @param done Function to call once done
 */
const image = (url, done) => {
  console.log('fetching %s', url);
  const buffList = buffers();
  const imageStream = new stream.Stream();
  let resultBuffer;

  imageStream.writable = true;
  imageStream.write = data => buffList.push(Buffer.from(data));
  imageStream.end = function () {
    resultBuffer = buffList.toBuffer();
  };

  request(url, (error, response) => {
    if (error) {
      done(`Unable to get ${url}. Error: ${error.message}`);
      return;
    }

    // Bail if we get anything other than 200
    if (response.statusCode !== 200) {
      done(`Unable to get ${url} because the URL did not return an image. Status code ${response.statusCode} received.`);
      return;
    }

    done(null, resultBuffer, true);
  }).pipe(imageStream);
};

module.exports = {
  image
};
