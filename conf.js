module.exports = function(pluginConf) {
  var pluginPath = pluginConf.pluginPath;
  return {
    "context": "/admin",
    "accessRole": "ADMIN",
    "models": {
      "document": pluginPath + "/models/Document.js"
    },
    "views": {
      "list": pluginPath + "/views/document/list.html",
      "addDocument": pluginPath + "/views/document/add.html"
    },
    "editables": [{"name": "name", "type": "text", "label": "Name", "required": true},
    {"name": "route", "type": "text", "label": "Route"},
    {"name": "content", "type": "file", "label": "Content"},
    {"name": "controller", "type": "text", "label": "Controller"}
    ],
    "numberOfRecordsPerPage" : 10
  }

}