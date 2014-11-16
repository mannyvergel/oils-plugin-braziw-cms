//var markedSwig = require('swig-marked');
//var Promise = require('es6-promise').Promise;
//var extras = require('swig-extras');
var nunjucks = require('nunjucks');

module.exports = function(pluginConf, web, wcmSettings) {
  var dmsUtils = web.dms.utils;
  var wcmConstants = web.dms.wcm.constants;
  var baseRouteViews = wcmSettings.baseRouteViews;
  var baseRoutePublic = wcmSettings.baseRoutePublic;

  var homeView = wcmSettings.homeView;

  var baseDir = wcmSettings.baseDir;
  var viewsDir = baseDir + wcmConstants.VIEWS_DIR;

  var publicDir = baseDir + wcmConstants.PUBLIC_DIR;

  var regex = new RegExp();

  var server = web.app;

  var wcm = web.dms.wcm;

  //var Swig = require('swig-promise').Swig;
  //wcm.swigMongo = new Swig();
  var NunjucksMongoLoader = nunjucks.Loader.extend({
    async: true,
    init: function(basePath) {
          this.pathsToNames = {};
          this.basePath = basePath;

      },
     
      getSource: function(name, callback) {

          var fullpath = this.basePath + name;
         
          this.pathsToNames[fullpath] = name;

          dmsUtils.retrieveDoc(fullpath, function(err, doc) {
            if (err) {throw err}
            if (!doc) {throw new Error('Document not found '+ fullpath)}
            callback(err, doc.content);
          })
      }
  });

  var nunjucksLoader = new NunjucksMongoLoader(viewsDir);

  wcm.templateEngine = new nunjucks.Environment(nunjucksLoader, {autoescape: true});
  
/*
  markedSwig.useFilter(wcm.swigMongo);
  markedSwig.useTag(wcm.swigMongo);
  extras.useFilter(wcm.swigMongo, 'truncate')
*/

  // var defaultOptions = {
  //   autoescape: true,
  //   varControls: ['{{', '}}'],
  //   tagControls: ['{%', '%}'],
  //   cmtControls: ['{#', '#}'],
  //   locals: {},
  //   cache: 'memory',
  //   loader: require('./utils/swigMongoLoader')(pkg, app, wcmSettings)
  // }
  // wcm.swigMongo.options = defaultOptions;
  
  //var route = '/^\/app\/static\/(.*)/';

  var getRegexFromStr = function(regexStr) {
    var flags = regexStr.replace(/.*\/([gimy]*)$/, '$1');
    var pattern = regexStr.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1');
    return new RegExp(pattern, flags);
  }
  if (!baseRoutePublic) {
    console.error('baseRoutePublic not found in settings');
  }

  if (!baseRouteViews) {
    console.error('baseRouteViews not found in settings');
  }
  var routePublic = getRegexFromStr('/^' + baseRoutePublic + '(.*)/');
  var routeViews = getRegexFromStr('/^' + baseRouteViews + '(.*)/');

  var dmsRoutes = web.dms.routes;
  
  web.on('dms.afterDocumentUpdate', function(doc) {
    var fullPath = doc.folderPath + doc.name;
    if (console.isDebug) {
      console.debug('Nunjucks cache invalidated: ' + fullPath);
    }

    nunjucksLoader.emit('update', fullPath);
    //wcm.swigMongo.invalidateCache();
  })

  var publicHandler = function() {
    return function(req, res, next) {
      if (console.isDebug) {
        console.debug('PASSING WCM PUBLIC LOADER');
      }
      var path = req.params[0];
      if (!path) {
        path = '/index.html';
      } else {
        path = path;
      }
      var dmsPath = publicDir + path;
      if (console.isDebug) {
        console.debug('Routing dms path %s', dmsPath);
      }
      dmsUtils.retrieveDoc(dmsPath, function(err, doc) {
        if (err) throw err;

        if (doc) {
          res.end(doc.content);
        } else {
          next();
        }
      })
    }
  }

  var renderMongoPath = function(path, req, res, next) {
    wcm.templateEngine.render(path);
    next();
  }

  /*var renderMongoPath = function(path, req, res, next) {
    dmsUtils.retrieveDoc('/web/views/' + path, function(err, doc) {

      var promiseOptions = new Promise(function(resolve, reject) {
        var controller = null;
        if (doc) {
          controller = doc.controller;
        }
        if (controller) {
          var controllerJs = web.include(controller);
          controllerJs(function(err, options) {
            if (err) throw err;

            resolve(options);
          }, req, res, next, doc)
        } else {
          resolve();
        }
      })

      promiseOptions.then(function(options) {
        options = options || {};
        options['_errors'] = req.flash('error');
        options['_infos'] = req.flash('info');
        options['_user'] = req.user;
        //console.log('!!!' + JSON.stringify(options));
         wcm.swigMongo.renderFile(path, options, function(err, content) {
            if (err) {
              if (err.message == 'NEXT') {
                if (console.isDebug) {
                  console.debug('Calling NEXT from mongo views handler.');
                }
                next();
              } else {
                res.send(500); 
                throw err;
              }

              return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
          })
      }, function(err){
        console.error(err);
        res.send(500);
        throw err;
      } )
       
      
      
    })
    
  }
  */

  var viewsHandler = function() {
    return function(req, res, next) {
      if (console.isDebug) {
        console.debug('PASSING WCM VIEWS LOADER');
      }
      var path = req.params[0];
      path = path + '.html';
      renderMongoPath(path, req, res, next);
      
    }
  }

  server.get(routePublic, publicHandler());
  server.all(routeViews, viewsHandler());
  server.all('/article/:YEAR/:SLUG', function(req, res, next) {
    var path = '/article.html';
    //console.log('!!!!' + path);
    renderMongoPath(path, req, res, next);
  })

  server.all('/article', function(req, res, next) {
    var path = '/article.html';
    //console.log('!!!!' + path);
    renderMongoPath(path, req, res, next);
  })


  if (homeView) {
    server.get('/', function(req, res, next) {
        renderMongoPath(homeView, req, res, next);
      })
    if (console.isDebug) {

      console.debug('Setting homeView to %s', homeView);
    }
  } else {
    if (console.isDebug) {
      console.debug('homeView not found. Skipping.');
    }
  }



}





