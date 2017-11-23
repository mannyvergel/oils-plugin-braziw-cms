module.exports = function(pluginConf, web, next) {
  var pjson = web.include('/package.json');
  var self = this;

  web.cms = self;
  //backwards
  web.dms = web.cms;

  web.cms.adminMenu = [];

  pluginConf = web.utils.extend(require('./conf/conf.js')(pluginConf), pluginConf);
  web.cms.conf = pluginConf;
  var context = pluginConf.context;
  
  self.routes = {

  }


  var DmsUtils = require('./utils/DmsUtils');
  web.cms.utils = new DmsUtils(pluginConf, web);
  web.cms.constants = new Object();
  web.cms.constants.file = 'file';
  web.cms.constants.folder = 'folder';

  web.cms.getCmsModel = function(docType) {
    if (web.modelCache[docType]) {
      return web.modelCache[docType];
    }

    return web.includeModel(web.cms.conf.models[docType]);
  }

  web.cms.registerCmsModel = function(modelName, path) {
    if (!web.cms.conf.models[modelName]) {
      web.cms.conf.models[modelName] = path;
    }
  }

  web.cms.getCmsModels = function() {
    var myModels = []
    for (var i in web.cms.conf.models) {
      myModels.push(web.cms.getCmsModel(i));
    }

    return myModels;
  }

  web.cms.getDocTypeMap = function() {
    var myModels = web.cms.getCmsModels();
    var docTypeMap = new Object();
    for (var i in myModels) {
      var modelDict = myModels[i].getModelDictionary();
      if (modelDict.name != 'Document') {
        var label = modelDict.label || modelDict.name;
        docTypeMap[modelDict.name] = label;
      }
    }

    return docTypeMap;
  }

  if (pluginConf.defaultMenu) {
    web.cms.adminMenu = pluginConf.defaultMenu;
  } else {
    web.cms.adminMenu = [
      {items:[{text:'Dashboard', link:context}]},
      {items:[{text:'DMS', link:context + '/document/list'}]}
    ];
  }

  if (web.auth && pluginConf.accessRole) {
    
    self.routes['/^' + context + '*/'] = {
      isRegexp: true,
      all: function(req, res, next) {
        web.auth.loginUtils.handleRole(pluginConf.accessRole, req, res, next);
      }
    }
  } 

  web.on('beforeRender', function(view, options) {
    options = options || {};
    options._cms = web.cms;
  })

  // self.routes[context] = function(req, res) {
  //   res.redirect(context + '/document/list');
  // }

  self.routes[context] = web.include(pluginConf.contextController);

  self.routes[context + '/dashboard'] = require('./controllers/admin/dashboard.js')(pluginConf, web);

  self.routes[context + '/document/list'] = require('./controllers/document/list.js')(pluginConf, web);
  //self.routes[context + '/document/add/:DOC_TYPE'] = require('./controllers/document/add.js')(pkg, web);
  self.routes[context + '/document/add'] = require('./controllers/document/add.js')(pluginConf, web);
  self.routes[context + '/document/edit/:FILE_ID'] = require('./controllers/document/add.js')(pluginConf, web);
  self.routes[context + '/document/delete/:DOC_ID'] = require('./controllers/document/delete.js')(pluginConf, web);

  self.routes[context + '/site-settings'] = require('./controllers/admin/site-settings.js')(pluginConf, web);

  self.routes[context + '/document/upload'] = require('./controllers/document/upload.js');
  self.routes[context + '/document/download'] = require('./controllers/document/download.js');

  self.routes['/css/plugin/cms/admin.css'] = {
    get: function(req, res) {
      web.utils.serveStaticFile(pluginConf.pluginPath + '/static/admin.css', res);
    }
  }

  self.routes['/css/plugin/cms/dms.css'] = {
    get: function(req, res) {
      web.utils.serveStaticFile(pluginConf.pluginPath + '/static/dms.css', res);
    }
  }

  self.routes['/js/plugin/cms/list-dropzone.js'] = {
    get: function(req, res) {
      web.utils.serveStaticFile(pluginConf.pluginPath + '/static/list-dropzone.js', res);
    }
  }
  web.applyRoutes(self.routes);
  web.cms.utils.initDocRoutes();

  // var WCM = require('./wcm/wcm.js');
  // web.cms.wcm = new WCM(pluginConf, web);

  var SiteSetting = web.cms.getCmsModel('SiteSetting');

  var updateSiteSettingCache = function(options) {
    SiteSetting.findOne({docType:'SiteSetting'}).lean().exec(function(err,siteSetting) {
      web.cms.siteSettingCache = web.cms.siteSettingCache || {
        title: pluginConf.defaultSiteTitle,
        currency: 'P'
      }

      if (siteSetting) {
        web.cms.siteSettingCache = siteSetting;
        if (options) {
          options['_site']  = web.cms.siteSetting;
        }

        if (console.isDebug) {
          console.debug('Site setting cache updated: ' + JSON.stringify(siteSetting));
        }
        
      }
      
    });
  }
  web.cms.updateSiteSettingCache = updateSiteSettingCache;
  updateSiteSettingCache();

  web.on('beforeRender', function(view, options) {
    
    
    options = options || {};
    var site = web.cms.siteSettingCache;
    site.version = pjson.version;
    options['_site'] = site;

  })
  web.on('initServer', function() {

    if (!web.syspars) {
      throw new Error('CMS needs oils-plugin-syspars plugin')
    }

    var Document = web.includeModel(pluginConf.models.Document);
    if (!Document.getModelDictionary().schema.createDt) {
      throw new Error("Your Document schema is outdated. Please change to latest.");
    }

    web.syspars.get('CMS_RUN_ONCE', function(err, syspar) {
      if (!syspar) {

        cmsRunOnce();

        web.syspars.set('CMS_RUN_ONCE', 'Y');
      } else {
        //TODO: [11/21/2017] in fare future, migration is not needed anymore.
        if (!syspar.createDt) {
          //createDt feature was added after this
          migrateTimestamp();
        }
      }

      function migrateTimestamp() {
        //migrate old documents with subroot meta {timestamp} 
        web.runOnce('CMS_MIGRATE_TIMESTAMP', function() {
          
          Document.find({}, function(err, documents) {
            if (!documents) {
              console.log("Nothing to migrate");
              return;
            }

            console.log("Start migration of doc timestamps.");

            for (var i=0; i<documents.length; i++) {
              var doc = documents[i];
             
              if (doc.meta) {
                doc.createBy = doc.createBy || doc.meta.createBy;
                doc.createDt = doc.createDt || doc.meta.createDt;
                doc.updateDt = doc.updateDt || doc.meta.lastUpdateDt;
                doc.updateBy = doc.updateBy || doc.meta.lastUpdateBy;

                doc.meta = undefined;
                doc.save(function(err) {
                  if (err) {
                    console.error(err);
                  }

                  Document.update({_id: doc._id}, {$unset: {meta: 1 }}, function(err) {
                    if (err) {
                      console.error(err);
                    }
                  });
                });
              }
              
            }

            console.log("Migrated", documents.length, "doc timestamps.");
          })
        });
      }


      function cmsRunOnce() {
        if (web.auth) {
          var User = web.auth.UserModel;


          var saveAdminUser = function() {
            var user = new User();
              user.username = 'admin';
              user.password = 'abcd1234';
              user.birthday= new Date();
              user.lastname ='John';
              user.firstname = 'Doe';
              user.middlename = 'Admin';
              user.role = 'ADMIN';
              user.fullname = 'Admin';
              user.nickname = 'Admin';
              user.email = 'admin@example.com';
              user.save(function(err) {
                if (err) throw err;
              });
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

        SiteSetting.findOne({docType:'SiteSetting'}, function(err, siteSetting) {
          if (!siteSetting) {
            siteSetting = new SiteSetting();
            siteSetting.title = pluginConf.defaultSiteTitle;
            siteSetting.currency = 'P';
            siteSetting.save(function(err) {
              if (err) throw err;
                web.cms.updateSiteSettingCache();
            })
          }
        })
      }
    });

  });
  

  next();
}

