module.exports = function(pluginConf) {
  var pluginPath = pluginConf.pluginPath;
  return {
    "context": "/admin",
    "accessRole": "ADMIN",
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