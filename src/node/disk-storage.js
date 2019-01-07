const {
  readFile,
  writeFile,
  mkdirSync,
} = require('fs');

module.exports = function createDiskStorage(directory) {
  directory = directory || './';
  // Remove trailing '/' for consistency:
  directory = directory.replace(/\/$/, '');
  directory += '/data';

  try {
    mkdirSync(directory, {recursive: true});
  } catch (ex) {
    //
  }

  function get(key) {
    return new Promise((resolve, reject) => {
      return readFile(directory + '/' + key + '.json', (err, data) => {
        if (err) return resolve(null);
        resolve(JSON.parse(data));
      });
    });
  }
  
  function put(key, value) {
    return new Promise((resolve, reject) => {
      return writeFile(directory + '/' + key + '.json', JSON.stringify(value), (err) => {
        if (err) return resolve(err);
        resolve(null);
      });
    });
  }

  return { get, put };
}
