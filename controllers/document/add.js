module.exports = function(pluginConf, web) {

  var Document = web.includeModel(pluginConf.models.Document);
  var context = pluginConf.context;
  var mongoose = web.lib.mongoose;
  var dmsUtils = web.cms.utils;
  var getModelEditables = function(docType) {
    var modelEditables = null;
    if (docType && docType != 'file' && docType != 'folder') {
      modelEditables = web.cms.getCmsModel(docType).getModelDictionary().editables;
    } else {
      modelEditables = web.cms.getCmsModel('Document').getModelDictionary().editables;
    }

    //console.log('!!!!' + docType + ' :::: ' + modelEditables);
    return modelEditables;
  }

  var myRoutes = {
    get: function(req, res) {
      

      dmsUtils.handleFolder(req.query.folderId, req, res, function(err, folder, folderId, parentFolders) {
        folderId = folderId || '';

        var docTypeMap = web.cms.getDocTypeMap();
        var fileId = req.params.FILE_ID;
        if (fileId) {
          fileId = dmsUtils.toObjectId(fileId);
          var docType = req.query.docType;
      
         if (docType && docType != 'file' && docType != 'folder') {
           Document = web.cms.getCmsModel(docType);
         }
          Document.findOne({_id:fileId}, function(err, doc) {
            
            if (!doc) {
              req.flash('error', 'File not found.');
              res.redirect(context + '/document/list?folderId=' + folderId);
              return;
            }
            var docType = doc.docType;
            if (doc.parentFolderId) {
              folderId = doc.parentFolderId.toString();
            }
            doc.route = doc.route || '';
            var modelEditables = getModelEditables(docType);
            res.renderFile(pluginConf.views.addDocument,
            {context: context, folderId: folderId, isFolder: doc.isFolder, doc: doc, modelEditables: modelEditables, docTypeMap: docTypeMap});
          })
        } else {
          //var docType = req.params['DOC_TYPE'];
          var doc = new Object();

          doc.docType = req.query.docType || web.cms.constants.file;
          doc.route = doc.route || '';
          doc.controller = doc.controller || '';
          var modelEditables = getModelEditables(doc.docType);
          res.renderFile(pluginConf.views.addDocument, 
          {context: context, folderId: folderId, isFolder: req.query.isFolder, doc: doc, customDocType: docType, modelEditables: modelEditables, docTypeMap: docTypeMap});
        }
        

      })

    },

    post: function(req, res) {
      

      dmsUtils.handleFolder(req.body.folderId, req, res, function(err, folder, folderId) {
        
        var docType = req.body.docType;
      
         if (docType && docType != 'file' && docType != 'folder') {
          Document = web.cms.getCmsModel(docType);
         }

        if (req.body._id) {
          //updateMode = true;
          var id = mongoose.Types.ObjectId(req.body._id);
          Document.findOne({_id: id}, function(err, doc) {
            if (doc) {
              handleDocSave(req, res, doc, folder, true);
              
            }
          })
        } else {
          var doc = new Document();
          handleDocSave(req, res, doc, folder, false);
        }


        
      })  
    }/*,

    onError: function(req, res, err, app) {
      req.flash('error', err.message);
      res.redirect('/dms');
    }*/
  }

  var handleDocSave = function(req, res, doc, folder, updateMode) {
        var docType = req.body.docType;
        var name = req.body.name;
        if (docType == web.cms.constants.folder) {
          doc.isFolder = true;
        }

        var editables = getModelEditables(docType);
        //console.log('!!!' + JSON.stringify(editables));
        for (var i in editables) {
          var editable = editables[i];
          var name = editable.name;
          var content = req.body[name];

          if (content) {

            if (editable.type == "file") {
              doc[name] = new Buffer(content, "utf8");
              //console.log('SAVEF BUFFER: ' + req.body[name])
            } else if (editable.type == "date") {
              doc[name] = new Date(content);
            } else {
              doc[name] = content;
              if (console.isDebug) {
                console.debug('Applying %s to %s', content, name);
              }
            }
          } else {
            if (editable.required) {
              req.flash('error', editable.name + ' is required.');
              if (updateMode) {
                res.redirect(context + '/document/edit/' + req.body._id);
              } else {
                var isFolder = '';
                
                if (doc.isFolder) {
                  isFolder = 'y';
                }
                res.redirect(context + '/document/add?isFolder=' + isFolder + '&docType=' + docType);
              }
              
              return;
            }
            if (name == "content") {
              if (content == "") {
                //only empty content when control exists
                doc[name] = null
              }
            } else {
              //check if these needs same logic as above
              doc[name] = null;
            }
            
            //console.log('!!!' + name + ' :: ' + doc[name]);
          }
          //console.log('!!!'+  i);
        } 

        

        doc.docType = docType;
        if (folder) {
          doc.parentFolderId = folder._id;
        }

        doc.meta.lastUpdateDt = new Date();
        if (req.user && req.user.username) {
          doc.meta.lastUpdateBy = req.user.username;
          if (!updateMode) {
            doc.meta.createBy = req.user.username;
          }
        }
        doc.save(function(err) {
            if (err) {
              console.error('Error saving doc', err);
              req.flash('error', 'Error saving document.');
            } else {
              req.flash('info', doc.name + ' saved successfully.');
              if (updateMode) {
                web.callEvent('cms.afterDocumentUpdate', [doc]);
              } else {
                web.callEvent('cms.afterDocumentInsert', [doc]);
              }
              
            }


            var folderId = doc.parentFolderId || '';
            res.redirect(context + '/document/list?folderId=' + folderId);
          })
        

        
  }

  return myRoutes;
}


