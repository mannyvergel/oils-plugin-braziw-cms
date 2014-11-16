module.exports = {
    "context": "/dms",
    "models": {
      "document": "/node_modules/oils-plugin-wateroo-cms/models/Document.js"
    },
    "views": {
      "list": "/node_modules/oils-plugin-wateroo-cms/views/document/list.html",
      "addDocument": "/node_modules/oils-plugin-wateroo-cms/views/document/add.html"
    },
    "editables": [{"name": "name", "type": "text", "label": "Name", "required": true},
    {"name": "route", "type": "text", "label": "Route"},
    {"name": "content", "type": "file", "label": "Content"},
    {"name": "controller", "type": "text", "label": "Controller"}
    ],
    "numberOfRecordsPerPage" : 10
  }