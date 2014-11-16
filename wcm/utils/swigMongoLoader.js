var path = require('path');
var Promise = require('es6-promise').Promise;

module.exports = function(pluginConf, app, wcmSettings) {

  var wcmConstants = app.dms.wcm.constants;

  var baseDir = wcmSettings.baseDir;
  var viewsDir = baseDir + wcmConstants.VIEWS_DIR;

  return {
    resolve: function(to, from) {
      //console.log('!!! %s %s', from, to);
      if (from) {
        return path.join(path.dirname(from), to);
      }
      return to;
    },

    load: function(identifier, cb) {
      var dmsPath = path.join(viewsDir, identifier);
      var promise = new Promise(function(resolve, reject) {
        var dmsUtils = app.dms.utils;
        dmsUtils.retrieveDoc(dmsPath, function(err, doc) {
          if (err) reject(err);
          if (app.isDebug) {
            //var content = doc ? doc.content : '';
            console.debug('Swig render from mongodb: %s', dmsPath);
          }

          if (doc) {
            var content = doc.content ? doc.content.toString() : '';
            //cb(null, content);
            resolve(content);
          } else {
            if (cb) {
              cb(new Error('NEXT'));
            } else {
              reject(new Error('File does not exist. ' + dmsPath));
            }
            
          }
        })
      })
      

      if (cb) {
        promise.then(function(result) {
          cb(null, result);
        }, function(err) {
          cb(err);
        })
      } else {
        return promise;
      }
    }
  }	
}