var mongoose = require('mongoose');
var Schema = mongoose.Schema;
module.exports = {
  name: 'Document',


  schema: {
    docType: {type: String, required:true, default: 'file'},
    
    parentFolderId: {type: Schema.ObjectId, index: true},
    folderPath: {type: String, index: true},
    
    name: {type: String, required: true},
    route: String,
    content: Buffer,
    controller: String,
    
    meta: {
      lastUpdateDt: {type: Date, default: Date.now},
      lastUpdateBy: {type: String, default: 'SYSTEM'},
      createDt: {type: Date, default: Date.now},
      createBy: {type: String, default: 'SYSTEM'}
    },

    //auto fields
    isFolder: {type: Boolean}, //need to store for sorting, type == 'Folder'
    lowerCaseName: {type: String, lowercase: true},
  },

  options: {
    strict: false
  },

  initSchema: function(schema){
    schema.index({parentFolderId: 1, lowerCaseName: 1}, {unique: true});
    //schema.index({voteCount: -1, meta.lastUpdateBy: -1});
    schema.pre('save', function(next) {
      this.isFolder = (this.docType == web.constants.dms.folder);
      this.lowerCaseName = this.name.toLowerCase();
      var self = this;
      web.dms.utils.getFolderPath(this, function(err, folderPath) {
        if (err) {
          console.error('Get folder path ' + err);
        }

        if (console.isDebug) {
          console.debug('Assigning folder path to %s: %s', self.name, folderPath);
        }

        self.folderPath = folderPath;
        next();
      })
      
    })
  },

  editables: [{"name": "name", "type": "text", "label": "Name", "required": true},
    {"name": "route", "type": "text", "label": "Route"},
    {"name": "controller", "type": "text", "label": "Controller"},
    {"name": "content", "type": "file", "label": "Content"}
    
    ]
} 