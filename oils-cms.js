

module.exports = function WaterooCms(pluginConf, web, next) {
  var self = this;

  web.dms = self;
  pluginConf = web.utils.extend(require('./conf.js')(pluginConf), pluginConf);

  var context = pluginConf.context;
  
  self.routes = {
  }

  var DmsUtils = require('./utils/DmsUtils');
  
  web.dms.utils = new DmsUtils(pluginConf, web);
  web.dms.constants = new Object();
  web.dms.constants.file = 'file';
  web.dms.constants.folder = 'folder';

  web.dms.docTypes = [web.dms.constants.folder, web.dms.constants.file];

  if (web.auth && pluginConf.accessRole) {
    
    self.routes['/' + context + '*/'] = {
      isRegexp: true,
      all: function(req, res, next) {
        web.auth.loginUtils.handleRole(pluginConf.accessRole, req, res, next);
      }
    }
  } 


  self.routes[context] = function(req, res) {
    res.redirect(context + '/document/list');
  }
  self.routes[context + '/document/list'] = require('./controllers/document/list.js')(pluginConf, web);
  //self.routes[context + '/document/add/:DOC_TYPE'] = require('./controllers/document/add.js')(pkg, web);
  self.routes[context + '/document/add'] = require('./controllers/document/add.js')(pluginConf, web);
  self.routes[context + '/document/edit/:FILE_ID'] = require('./controllers/document/add.js')(pluginConf, web);
  self.routes[context + '/document/delete/:DOC_ID'] = require('./controllers/document/delete.js')(pluginConf, web);

  web.applyRoutes(self.routes);
  web.dms.utils.initDocRoutes();

  // var WCM = require('./wcm/wcm.js');
  // web.dms.wcm = new WCM(pluginConf, web);


  web.on('initServer', function() {

    if (!web.syspars) {
      console.warn('wateroo cms needs oils-plugin-syspars plugin');
      return;
    }
    web.syspars.get('DMS_RUN_ONCE', function(err, syspar) {
      if (!syspar) {


        if (web.auth) {
        var User = web.auth.UserModel;


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

        console.log('First time to run. Running DMS init data.');
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
      }
         
        web.syspars.set('DMS_RUN_ONCE', 'Y')
      }
    });
  });


  next();
}

