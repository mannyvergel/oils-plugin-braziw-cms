const path = require('path');
const fs = require('fs');
module.exports = function(pluginConf) {
  let dataDir = web.conf.dataDir;
  let uploadDir = web.conf.uploadDir;

  uploadDir = uploadDir || (path.join(dataDir || path.join(web.conf.baseDir, '/data/'), 'upload'))
  let pluginPath = pluginConf.pluginPath;

  let parentDir = path.join(uploadDir, '../');
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir);
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  return {
    "context": "/admin",
    "accessRole": "ADMIN",
    "showIconDescrip": true,
    "autoCreateAdminUser": false,
    "uploadDir": uploadDir,
    "adminTemplate": pluginPath + "/views/templates/admin-template.html",
    "models": {
      //"document": pluginPath + "/models/Document.js",
      "Document": pluginPath + "/models/Document.js",
      "SiteSetting": pluginPath + "/models/SiteSetting.js",
    },
    "views": {
      "list": pluginPath + "/views/document/list.html",
      "addDocument": pluginPath + "/views/document/add.html"
    },
    "defaultSiteTitle": "Braziw CMS",
    "numberOfRecordsPerPage" : 10,
    "contextController": pluginPath + "/controllers/admin.js"
  }

}