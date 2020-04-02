'use strict';

const mongoose = web.require('mongoose');
const Schema = mongoose.Schema;

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
    mimeType: String, //optional for now, maybe make it required in the future, added auto assign
    fileSize: Number, //optional for now, maybe make it required in the future
    content: Buffer,

    updateDt: {type: Date, default: Date.now},
    updateBy: {type: String, default: 'SYSTEM'},
    createDt: {type: Date, default: Date.now},
    createBy: {type: String, default: 'SYSTEM'},

    //auto fields
    isFolder: {type: Boolean}, //need to store for sorting, type == 'Folder' , automatically assigned out of docType
    lowerCaseName: {type: String, lowercase: true},  //automatically assigned
  },

  options: {
    strict: false
  },

  initSchema: function(schema){
    schema.index({parentFolderId: 1, lowerCaseName: 1}, {unique: true});

    schema.pre('save', async function() {
      this.isFolder = (this.docType == web.cms.constants.folder);
      this.lowerCaseName = this.name.toLowerCase();

      if (!this.isFolder) {
        if (!this.mimeType) {
          //assign mime type if possible
          this.mimeType = web.utils.getMimeType(this.name);
          if (web.conf.isDebug) {
            console.debug("Assigning mime type", this.mimeType, " for the first time:", this.name);
          }
        }

        if (!this.fileSize) {
          //for now do only once to conserve perf
          this.fileSize = this.content ? this.content.byteLength : 0;
          if (web.conf.isDebug) {
            console.debug("Assigning file size", this.fileSize, " for the first time:", this.name);
          }
        }
      }

      let self = this;
      let folderPath = await web.cms.utils.getFolderPath(self);
      if (!folderPath) {
        console.error('Get folder path ' + err);
      } else {
        if (console.isDebug) {
          console.debug('Assigning folder path to %s: %s', self.name, folderPath);
        }

        self.folderPath = folderPath;
      }
      
    })
  },

  editables: [{"name": "name", "type": "text", "label": "Name", "required": true},
    {"name": "docType", "type": "text", "label": "Doc Type"},
    {"name": "mimeType", "type": "text", "label": "Mime Type"},
    {"name": "content", "type": "file", "label": "Content"},
    ]
} 