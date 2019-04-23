const _path = require('path');
const async = require('async');
module.exports = function(pluginConf, web) {
  let self = this;

  let mongoose = web.require('mongoose');
  let Document = web.includeModel(pluginConf.models.Document);



  self.handleFolder = function(parentFolderId, req, res, callback, parentFolders) {
    return new Promise(function(resolve, reject) {
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


        let folderId = null;
        if (parentFolders) {
          folder = parentFolders[parentFolders.length-1];
          folderId = folder._id.toString();
        }

        if (callback) {
          callback(err, folder, folderId, parentFolders); 
        }

        if (err) {
          reject(err);
        } else {
          resolve(folder, folderId, parentFolders);
        }
        

      })
    });

    

    
  }


  let redirectToMainWithError = function(req, res, error) {
    req.flash('error', error);
    res.redirect(pluginConf.context);
  };

  self.toObjectId = function(idStr) {
    try {
      let id = mongoose.Types.ObjectId(idStr);
      return id;
    } catch(e) {
      console.error('id error: ' + idStr, e);
    }

    return null;
  };

  self.initDocRoutes = function() {
    Document.find({route: {'$ne': null}}, '', {lean: true}, function(err, docs) {
      for (let i in docs) {
        let doc = docs[i];
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

  let removeRoute = function(routeStr) {
    let routes = web.app.routes;
    for (k in routes.get) {
      if (routes.get[k].path + "" === routeStr + "") {
        routes.get.splice(k,1);
        break;
      }
    }
  };

  self.getChildren = function(doc, callback) {
    return new Promise(function(resolve, reject) {
      Document.find({parentFolderId:doc._id}, function(err, docs) {
        if (err) throw err;

        if (callback) {
          callback(err, docs);
        }

        resolve(docs);
      });
    });
    
  }

  self.deleteDoc = function(doc, callback) {
    //breadth first search delete
    return self._breadthFirstSearchDelete([doc], callback);
  }

  //slower but more reliable than recursive
  self._breadthFirstSearchDelete = function(arrDocs, callback) {
    return new Promise(function(resolve, reject) {
      async.whilst(function() {
        return arrDocs.length > 0;
      }, function(asyncCallback) {
        let lastDoc = arrDocs.pop();
        if (lastDoc.isFolder) {
          self.getChildren(lastDoc, function(err, docs) {
            for (let i in docs) {
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
        if (callback) {
          callback(err);
        }
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });

    

   
  }


  self.deletePath = function(path, callback) {
    return new Promise(function(resolve, reject) {
      self.retrieveDoc(path, function(err, doc) {
        if (err) throw err;

        if (!doc) {
          console.warn('Delete path do not exist ' + path);
          if (callback) {
            callback();
          }

          resolve();
        } else {
          self.deleteDoc(doc, function(err) {
            if (err) throw err;
            if (callback) {
              callback();
            }

            resolve();
          })
        }
      })
    })
    
  }

  self.checkExistence = function(name, parentDocId, optionalDocType, callback) {
    if (arguments.length < 4) {
      callback = optionalDocType;
      optionalDocType = null;
    }
      
    return new Promise(function(resolve, reject) {
      
      let SpecificObject = null;
      if (optionalDocType) {
        SpecificObject = web.cms.getCmsModel(optionalDocType);
      } else {
        SpecificObject = Document;
      }
      SpecificObject.findOne({parentFolderId: parentDocId, lowerCaseName: name.toLowerCase()}, function(err, doc) {
        if (callback) {
          callback(err, doc);
        }

        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      })
    });
    
  };

  self.retrieveDoc = function(path, callback) {
    return new Promise(function(resolve, reject) {
      let arrPaths = self.getPathAsArray(path);

      self._retrieveDocFromArray(arrPaths, function(err, doc) {
        if (err) throw err;
        if (callback) {
          callback(err, doc);
        }
        resolve(doc);
      })
    });
    
  }

  self.retrieveDocById = function(id, callback) {
    return new Promise(function(resolve, reject) {
      Document.findOne({_id: id}, function(err, doc) {
        if (callback) {
          callback(err, doc);
        }

        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      })
    });
  }

  self._retrieveDocFromArray = function(arrPaths, callback, currDoc) {
    return new Promise(function(resolve, reject) {

      if (arrPaths.length == 0) {
        if (callback) {
          callback(null, currDoc);
        }
        resolve(currDoc);
        return;
      }

      // if (console.isDebug) {
      //   console.debug('Retrieve doc from array: ' + arrPaths);
      // }
      let firstFile = arrPaths[0];

      arrPaths.shift();

      let parentDocId = currDoc ? currDoc._id : null;

      self.checkExistence(firstFile, parentDocId, function(err, doc) {
        if (err) throw err;

        if (!doc) {
          if (callback) {
            callback();
          }
          resolve();
        } else {
          self._retrieveDocFromArray(arrPaths, callback, doc);
        }
      });
    });

    
  }

  self.getFolderPath = function(doc, cb, parentFolders) {

    return new Promise(function(resolve, reject) {
      if (doc.folderPath && !parentFolders) {
        //console.log('Hello!!', doc._id, doc.folderPath, parentFolders);
        if (cb) {
          cb(null, doc.folderPath);
        }
        resolve(doc.folderPath);
        return;
      }
      if (parentFolders == null) {
        parentFolders = [];
      }

      if (!doc.parentFolderId) {
        let folderPath = '/';
        if (parentFolders && parentFolders.length > 0) {
          folderPath = folderPath + parentFolders.join('/') + '/';
        }
        if (cb) {
          cb(null, folderPath);
        }
        resolve(folderPath);
        return;
      }
      //console.log('!!!' + doc.parentFolderId);
      self.retrieveDocById(doc.parentFolderId, function(err, doc) {
        if (err) {
          if (cb) {
            cb(err, null);
          }
          reject(err);
          return;
        }
        parentFolders.unshift(doc.name);
        self.getFolderPath(doc, cb, parentFolders);
      });
    });
    
   
  }

  self.createFileIfNotExist = function(path, optionalContent, callback) {
    if (arguments.length < 3) {
      callback = optionalContent;
      optionalContent = null;
    }

    return new Promise(function(resolve, reject) { 

      if (optionalContent !== null && typeof optionalContent === 'string') {
        let strValue = optionalContent;
        optionalContent = new Object();
        optionalContent.content = strValue;
      }

      let parentDir = _path.dirname(path);
      self.mkdirs(parentDir, function(err, parentDoc) {

        if (err) throw err;

        let basename = _path.basename(path);
        let parentDocId = parentDoc ? parentDoc._id : null

        let myDocType = null;
        if (optionalContent && optionalContent.docType) {
          myDocType = optionalContent.docType;
        }

        self.checkExistence(basename, parentDoc, myDocType, function(err, doc) {
          if (err) throw err;

          if (!doc) {
            if (myDocType) {
              let SpecificObject = web.cms.getCmsModel(myDocType);
              doc = new SpecificObject();
            } else {
              doc = new Document();
            }
            
        
            doc.name = basename;
            if (parentDoc) {
              doc.parentFolderId = parentDoc._id;
            }

            doc.docType = web.cms.constants.file;

            if (optionalContent) {
              for (let i in optionalContent) {
                doc[i] = new Buffer(optionalContent[i], "utf8");  
              }
            }

            doc.save(function(err) {
              if (err) {
                if (callback) {
                  callback(err);
                }
                reject(err);
              } else {
                if (callback) {
                  callback(null, doc, false);
                }
                resolve(doc, false);
              }
            });


          } else {
            if (callback) {
              callback(null, doc, true);
            }

            resolve(doc, true);

          }
        })
       
        
      });
    });

    
  };

  self.getPathAsArray = function(path) {
    //console.log('!!!!' + path + ' ::: ' + path.substr(1).split('/'))
    path = _path.normalize(path);
    return path.substr(1).split(_path.sep);
  }

  self.mkdirs = function(path, callback) {
    let arrFolders = self.getPathAsArray(path);
    //console.log('!' + arrFolders);
    return _mkdirs(arrFolders, callback, 0);
   
  };

  let _mkdirs = function(arrFolders, callback, index, parentFolderId) {
    return new Promise(function(resolve, reject) {
      let folderName = arrFolders[index];
      //console.log('ZZZ!!!' + folderName);
      Document.findOne({parentFolderId: parentFolderId, lowerCaseName: folderName.toLowerCase()}, function(err, doc) {
        let myCb = function(err, doc) {
          if (callback) {
            callback(err, doc);
          }

          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        }
        if (!doc) {
          doc = new Document();
          doc.name = folderName;
          
          doc.parentFolderId = parentFolderId;
          doc.docType = web.cms.constants.folder;
          doc.save(function(err) {
            if (err) {
              console.error(err);
            } else {
              _handleMkdirsCallback(doc, arrFolders, myCb, index, parentFolderId);
            }
          });
        } else {
          _handleMkdirsCallback(doc, arrFolders, myCb, index, parentFolderId);
        }
        
      })
    });

    
  };

  let _handleMkdirsCallback = function(doc, arrFolders, callback, index, parentFolderId) {
    index++;
    if (index < arrFolders.length) {
      _mkdirs(arrFolders, callback, index, doc._id);
    } else {
      if (callback) {
        callback(null, doc);
      }
    }
  }
}
