var _path = require('path');
var async = require('async');
module.exports = function(pluginConf, web) {
  var self = this;

  var mongoose = require('mongoose');
  var Document = web.includeModel(pluginConf.models.document);



  self.handleFolder = function(parentFolderId, req, res, callback, parentFolders) {
    if (parentFolderId) {
      try {
        parentFolderId = mongoose.Types.ObjectId(parentFolderId)
      } catch(e) {
        console.error('Folder id error: ' + parentFolderId, e);
        redirectToMainWithError(req, res, 'Invalid folder.');
        return;
      }
      
    }
    Document.findOne({_id: parentFolderId}, function(err, folder) {
      if (parentFolderId) {
        if (!folder) {
          console.error('Folder not found error: ' + parentFolderId);
          redirectToMainWithError(req, res, 'Folder not found.');
          return
        }
      }
    
      if (folder) {
        if (parentFolders == null) {
          parentFolders = [];
        }
        parentFolders.unshift(folder);
        if (folder.parentFolderId) {
          self.handleFolder(folder.parentFolderId.toString(), req, res, callback, parentFolders);
          //WARNING this will return
          return;  
        }
        
      }


      var folderId = null;
      if (parentFolders) {
        folder = parentFolders[parentFolders.length-1];
        folderId = folder._id.toString();
      }
      callback(err, folder, folderId, parentFolders); 
      
      

    })

    
  }


  var redirectToMainWithError = function(req, res, error) {
    req.flash('error', error);
    res.redirect(pluginConf.context);
  };

  self.toObjectId = function(idStr) {
    try {
      var id = mongoose.Types.ObjectId(idStr);
      return id;
    } catch(e) {
      console.error('id error: ' + idStr, e);
    }

    return null;
  };

  self.initDocRoutes = function() {
    Document.find({route: {'$ne': null}}, '', {lean: true}, function(err, docs) {
      for (var i in docs) {
        var doc = docs[i];
        self.addDocRoute(doc);
        
      }
      
    })
  };

  self.addDocRoute = function(doc) {
    if (console.isDebug) {
      console.log('Adding DMS route: %s <--> %s', doc.route, doc.name);
    }

    web.app.get(doc.route, function(req, res) {
      //TODO: stream
      res.send(doc.content.toString('utf8'));
      res.end();
    })
  };

  self.removeDocRoute = function(doc) {
    removeRoute(doc.route);
  };

  var removeRoute = function(routeStr) {
    var routes = web.app.routes;
    for (k in routes.get) {
      if (routes.get[k].path + "" === routeStr + "") {
        routes.get.splice(k,1);
        break;
      }
    }
  };

  self.getChildren = function(doc, callback) {
    Document.find({parentFolderId:doc._id}, function(err, docs) {
      if (err) throw err;

      callback(err, docs);
    });
  }

  self.deleteDoc = function(doc, callback) {
    //breadth first search delete
    self._breadthFirstSearchDelete([doc], callback);
  }

  //slower but more reliable than recursive
  self._breadthFirstSearchDelete = function(arrDocs, callback) {
    
    async.whilst(function() {
      return arrDocs.length > 0;
    }, function(asyncCallback) {
      var lastDoc = arrDocs.pop();
      if (lastDoc.isFolder) {
        self.getChildren(lastDoc, function(err, docs) {
          for (var i in docs) {
            arrDocs.unshift(docs[i]);
          }

          if (console.isDebug) {
            console.debug('Deleting ' + lastDoc.name);
          }
          lastDoc.remove(function(err) {
            if (err) throw err;
            asyncCallback();
          })
        })
      } else {
        if (console.isDebug) {
            console.debug('Deleting ' + lastDoc.name);
          }
        lastDoc.remove(function(err) {
          if (err) throw err;
          asyncCallback();
        })
      }

    },

    function(err) {
      callback(err);
    })

   
  }


  self.deletePath = function(path, callback) {
    self.retrieveDoc(path, function(err, doc) {
      if (err) throw err;

      if (!doc) {
        console.warn('Delete path do not exist ' + path);
        callback();
      } else {
        self.deleteDoc(doc, function(err) {
          if (err) throw err;

          callback();
        })
      }
    })
  }

  self.checkExistence = function(name, parentDocId, callback) {
    Document.findOne({parentFolderId: parentDocId, lowerCaseName: name.toLowerCase()}, function(err, doc) {
      callback(err, doc);
    })
  };

  self.retrieveDoc = function(path, callback) {
    var arrPaths = self.getPathAsArray(path);

    self._retrieveDocFromArray(arrPaths, function(err, doc) {
      if (err) throw err;
      callback(err, doc);
    })
  }

  self.retrieveDocById = function(id, callback) {
    Document.findOne({_id: id}, function(err, doc) {
      callback(err, doc);
    })
  }

  self._retrieveDocFromArray = function(arrPaths, callback, currDoc) {
    if (arrPaths.length == 0) {
      callback(null, currDoc);
      return;
    }

    if (console.isDebug) {
      console.debug('Retrieve doc from array: ' + arrPaths);
    }
    var firstFile = arrPaths[0];

    arrPaths.shift();

    var parentDocId = currDoc ? currDoc._id : null;

    self.checkExistence(firstFile, parentDocId, function(err, doc) {
      if (err) throw err;

      if (!doc) {

        callback();
      } else {
        self._retrieveDocFromArray(arrPaths, callback, doc);
      }
    });
    
  }

  self.getFolderPath = function(doc, cb, parentFolders) {
    if (doc.folderPath) {
      cb(null, doc.folderPath);
      return;
    }
    if (parentFolders == null) {
      parentFolders = [];
    }

    if (!doc.parentFolderId) {
      var folderPath = '/';
      if (parentFolders && parentFolders.length > 0) {
        folderPath = folderPath + parentFolders.join('/') + '/';
      }
      cb(null, folderPath);
      return;
    }
    //console.log('!!!' + doc.parentFolderId);
    self.retrieveDocById(doc.parentFolderId, function(err, doc) {
      if (err) {cb(err, null)}
      parentFolders.unshift(doc.name);
      self.getFolderPath(doc, cb, parentFolders);
    });
   
  }

  self.createFileIfNotExist = function(path, optionalContent, callback) {
    if (arguments.length < 3) {
      callback = optionalContent;
      optionalContent = null;
    }

    var parentDir = _path.dirname(path);
    self.mkdirs(parentDir, function(err, parentDoc) {
      if (err) throw err;

      var basename = _path.basename(path);
      var parentDocId = parentDoc ? parentDoc._id : null
      self.checkExistence(basename, parentDoc, function(err, doc) {
        if (err) throw err;

        if (!doc) {
          doc = new Document();
      
          doc.name = basename;
          if (parentDoc) {
            doc.parentFolderId = parentDoc._id;
          }

          doc.docType = web.constants.dms.file;

          if (optionalContent) {
            doc.content = new Buffer(optionalContent, "utf8");
          }

          doc.save(function(err) {
            if (err) {
              callback(err);
            } else {
              callback(null, doc, false);
            }
          });


        } else {
          callback(null, doc, true);
        }
      })
     
      
    });
  };

  self.getPathAsArray = function(path) {
    //console.log('!!!!' + path + ' ::: ' + path.substr(1).split('/'))
    path = _path.normalize(path);
    return path.substr(1).split(_path.sep);
  }

  self.mkdirs = function(path, callback) {
    var arrFolders = self.getPathAsArray(path);
    //console.log('!' + arrFolders);
    _mkdirs(arrFolders, callback, 0);
   
  };

  var _mkdirs = function(arrFolders, callback, index, parentFolderId) {
    var folderName = arrFolders[index];
    //console.log('ZZZ!!!' + folderName);
    Document.findOne({parentFolderId: parentFolderId, lowerCaseName: folderName.toLowerCase()}, function(err, doc) {
      if (!doc) {
        doc = new Document();
        doc.name = folderName;
        
        doc.parentFolderId = parentFolderId;
        doc.docType = web.constants.dms.folder;
        doc.save(function(err) {
          if (err) {
            console.error(err);
          } else {
            _handleMkdirsCallback(doc, arrFolders, callback, index, parentFolderId);
          }
        });
      } else {
        _handleMkdirsCallback(doc, arrFolders, callback, index, parentFolderId);
      }
      
    })
  };

  var _handleMkdirsCallback = function(doc, arrFolders, callback, index, parentFolderId) {
    index++;
    if (index < arrFolders.length) {
      _mkdirs(arrFolders, callback, index, doc._id);
    } else {
      callback(null, doc);
    }
  }
}
