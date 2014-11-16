var async = require('async');

module.exports = function(pluginConf, web) {
  
  var self = this;

  self.constants = new Object();
  
  self.constants.VIEWS_DIR = '/views';
  self.constants.PUBLIC_DIR = '/public';

  web.dms.wcm = self;

  var dmsUtils = web.dms.utils;
  var DEFAULT_SETTINGS_PATH = '/web/settings.json';
  async.series([function(asyncCallback) {
    var defaultSettings = {
      baseDir: '/web',
      baseRouteViews: '/p',
      baseRoutePublic: '/pub',
      homeView: '/index.html'
    }

    dmsUtils.createFileIfNotExist(DEFAULT_SETTINGS_PATH, JSON.stringify(defaultSettings), function(err, doc, alreadyExists) {
      asyncCallback();
    });

  }], function() {
    dmsUtils.retrieveDoc(DEFAULT_SETTINGS_PATH, function(err, doc) {
      if (err) throw err;
      if (doc) {
        var settings = JSON.parse(doc.content);
        //var baseDir = settings.baseDir;
        

        require('./wcmRoute')(pluginConf, web, settings);
      } else {
        throw new Error('Path not found ' + DEFAULT_SETTINGS_PATH);
      }
    })
  })


  web.on('initializeServer', function() {
    
    var SysPar = models('SysPar');

    SysPar.findOne({key: 'RUN_ONCE'}, function(err, syspar) {
      if (!syspar) {
      //if (true) {
        var User = models('User');


        var saveAdminUser = function() {
          var user = new User();
            user.username = 'admin';
            user.password = 'abcd1234';
            user.role = 'ADMIN';
            user.fullname = 'Admin';
            user.nickname = 'Admin';
            user.email = 'admin@example.com';
            user.save();
            console.log('Admin user saved.');
        }

        console.log('First time to run. Running init data.');
         //init-data
        User.findOne({username:'admin'}, function(err, user) {
          if (!user) {
            saveAdminUser();
          } else if (user.role != 'ADMIN') {
            user.remove(function() {
              saveAdminUser();
            })
          }
          
        });

        //make sure folders exists in dms
         
        var fs = require('fs')
        async.series([
          function(callback) {
             fs.readFile('./conf/plugins/oils-dms/wcm/templates/main.html', 'utf8', function (err,data) {
              if (err) {
                return console.error(err);
              }
             
              dmsUtils.createFileIfNotExist('/web/views/templates/main.html', data, callback);
            });
          },

          function(callback) {
             fs.readFile('./conf/plugins/oils-dms/wcm/templates/index.html', 'utf8', function (err,data) {
                if (err) {
                  return console.error(err);
                }
                
                dmsUtils.createFileIfNotExist('/web/views/index.html', data, callback);
              });
          },

          function(callback) {
             dmsUtils.createFileIfNotExist('/web/public/css/main.css', "", callback);
          }

        ]);
         
         

           


        syspar = new SysPar();
        syspar.key = 'RUN_ONCE';
        syspar.val = 'Y';
        syspar.save();
      }
    });
  });
  

}