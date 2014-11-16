

module.exports = function WaterooCms(pluginConf, web, next) {
  var self = this;
  web.dms = self;

  pluginConf = web.utils.extend(require('./conf.js'), pluginConf);

  var context = pluginConf.context;
  
  self.routes = {
  }

  var DmsUtils = require('./utils/DmsUtils');
  
  self.utils = new DmsUtils(pluginConf, web);
  web.constants.dms = new Object();
  web.constants.dms.file = 'file';
  web.constants.dms.folder = 'folder';

  web.dms.docTypes = [web.constants.dms.folder, web.constants.dms.file];
  //app.dms.conf = pkg.oils;


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

  var WCM = require('./wcm/wcm.js');
  self.wcm = new WCM(pluginConf, web);
}

