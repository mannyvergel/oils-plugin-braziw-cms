var mongoose = web.lib.mongoose;
var Schema = mongoose.Schema;
module.exports = {
  name: 'Document',
  label: 'File',
  docType: 'file',

  schema: {
    docType: {type: String, required:true, default: 'file'},
    
    parentFolderId: {type: Schema.ObjectId, index: true},
    folderPath: {type: String, index: true}, //automatically assigned
    
    name: {type: String, required: true},
    route: String, // not sure what this is, seems not used.
    mimeType: String, //optional for now, maybe make it required in the future
    fileSize: Number, //optional for now, maybe make it required in the future
    content: Buffer,
    
    meta: {
      lastUpdateDt: {type: Date, default: Date.now},
      lastUpdateBy: {type: String, default: 'SYSTEM'},
      createDt: {type: Date, default: Date.now},
      createBy: {type: String, default: 'SYSTEM'}
    },

    //auto fields
    isFolder: {type: Boolean}, //need to store for sorting, type == 'Folder' , automatically assigned out of docType
    lowerCaseName: {type: String, lowercase: true},  //automatically assigned
  },

  options: {
    strict: false
  },

  initSchema: function(schema){
    schema.index({parentFolderId: 1, lowerCaseName: 1}, {unique: true});
    //schema.index({voteCount: -1, meta.lastUpdateBy: -1});
    schema.pre('save', function(next) {
      this.isFolder = (this.docType == web.cms.constants.folder);
      this.lowerCaseName = this.name.toLowerCase();
      var self = this;
      web.cms.utils.getFolderPath(this, function(err, folderPath) {
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
    {"name": "content", "type": "file", "label": "Content"}
    ]
} 