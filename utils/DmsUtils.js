'use strict';

const _path = require('path');

module.exports = function(pluginConf, web) {
  let self = this;

  let mongoose = web.require('mongoose');
  let Document = web.includeModel(pluginConf.models.Document);

  self.handleFolder = async function(parentFolderId, req, res, callback, parentFolders) {
    if (parentFolderId) {
      try {
        parentFolderId = mongoose.Types.ObjectId(parentFolderId)
      } catch(e) {
        console.error('Folder id error: ' + parentFolderId, e);
        redirectToMainWithError(req, res, 'Invalid folder.');
        return;
      }
      
    } else {
      parentFolderId = null;
    }

    let folder = await Document.findOne({_id: parentFolderId});

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
        return await self.handleFolder(folder.parentFolderId.toString(), req, res, callback, parentFolders);
      }
      
    }


    let folderId = null;
    if (parentFolders) {
      folder = parentFolders[parentFolders.length-1];
      folderId = folder._id.toString();
    }

    if (callback) {
      callback(null, folder, folderId, parentFolders); 
    }

    return  {folder, folderId, parentFolders};
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

  self.initDocRoutes = async function() {
    let docs = await Document.find({route: {'$ne': null}}, '', {lean: true});

    for (let i in docs) {
      let doc = docs[i];
      self.addDocRoute(doc);
      
    }
    
    return docs;
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

  self.getChildren = async function(doc, cb) {
    let docs = await Document.find({parentFolderId:doc._id});
    if (cb) {
      cb(null, docs);
    }
    return docs;
  }

  self.deleteDoc = async function(doc, cb) {
    //breadth first search delete
    await self._breadthFirstSearchDelete([doc]);

    if (cb) {
      cb();
    }
  }

  //slower but more reliable than recursive
  self._breadthFirstSearchDelete = async function(arrDocs, cb) {
    while (arrDocs.length > 0) {
      let lastDoc = arrDocs.pop();

      if (lastDoc.isFolder) {
        let docs = await self.getChildren(lastDoc);
        for (let i in docs) {
          arrDocs.unshift(docs[i]);
        }
        if (console.isDebug) {
          console.debug('Deleting ' + lastDoc.name);
        }

        await lastDoc.remove();

      } else {
        if (console.isDebug) {
          console.debug('Deleting ' + lastDoc.name);
        }

        await lastDoc.remove();
      }

    }

    if (cb) {
      cb();
    }
   
  }


  self.deletePath = async function(path, callback) {
    let doc = await self.retrieveDoc(path);

    if (!doc) {
      console.warn('Delete path do not exist ' + path);
    } else {
      await self.deleteDoc(doc);
    }

    if (callback) {
      callback();
    }
  }

  self.checkExistence = async function(name, parentDocId, optionalDocType, callback) {
    if (web.objectUtils.isFunction(optionalDocType)) {
      callback = optionalDocType;
      optionalDocType = null;
    }
      
    let SpecificObject = null;
    if (optionalDocType) {
      SpecificObject = web.cms.getCmsModel(optionalDocType);
    } else {
      SpecificObject = Document;
    }
    let doc = await SpecificObject.findOne({parentFolderId: parentDocId, lowerCaseName: name.toLowerCase()});

    if (callback) {
      callback(null, doc);
    }

    return doc;
  };

  self.retrieveDoc = async function(path, callback) {

      let arrPaths = self.getPathAsArray(path);

      let doc = await self._retrieveDocFromArray(arrPaths);

      if (callback) {
        callback(null, doc);
      }

      return doc;    
  }

  self.retrieveDocById = async function(id, callback) {

      let doc = await Document.findOne({_id: id});
      if (callback) {
        callback(null, doc);
      }
      
      return doc;
  }

  self._retrieveDocFromArray = async function(arrPaths, callback, currDoc) {

    if (arrPaths.length == 0) {
      if (callback) {
        callback(null, currDoc);
      }
      return currDoc;
    }

    let firstFile = arrPaths[0];

    arrPaths.shift();

    let parentDocId = currDoc ? currDoc._id : null;

    let doc = await self.checkExistence(firstFile, parentDocId);
    if (!doc) {
      if (callback) {
        callback();
      }

      return;
    }

    return await self._retrieveDocFromArray(arrPaths, callback, doc);
  }


  self.getFolderPath = async function(doc, cb, parentFolders) {

    if (doc.folderPath && !parentFolders) {
      if (cb) {
        cb(null, doc.folderPath);
      }

      return doc.folderPath;
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
      return folderPath;
    }

    let docParent = await self.retrieveDocById(doc.parentFolderId);
    if (!docParent) {
      throw new Error("[getFolderPath] Doc not found");
    }

    parentFolders.unshift(docParent.name);
    return await self.getFolderPath(docParent, cb, parentFolders);
   
  }

  self.createFileIfNotExist = async function(path, optionalContent, callback) {
    if (web.objectUtils.isFunction(optionalContent)) {
      callback = optionalContent;
      optionalContent = null;
    }


    if (optionalContent !== null && typeof optionalContent === 'string') {
      let strValue = optionalContent;
      optionalContent = new Object();
      optionalContent.content = strValue;
    }

    let parentDir = _path.dirname(path);
    let parentDoc = await self.mkdirs(parentDir);

    let basename = _path.basename(path);
    let parentDocId = parentDoc ? parentDoc._id : null

    let myDocType = null;
    if (optionalContent && optionalContent.docType) {
      myDocType = optionalContent.docType;
    }

    let doc = await self.checkExistence(basename, parentDoc, myDocType);


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
          doc[i] = Buffer.from(optionalContent[i], "utf8");  
        }
      }

      await doc.save();

      doc.existingDoc = false;
      if (callback) {
        callback(null, doc, false);
      }

      return doc;


    } else {

      doc.existingDoc = true;
      if (callback) {
        callback(null, doc, true);
      }

      return doc;

    }
  }

  self.getPathAsArray = function(path) {
    //console.log('!!!!' + path + ' ::: ' + path.substr(1).split('/'))
    path = _path.normalize(path);
    return path.substr(1).split(_path.sep);
  }

  self.mkdirs = async function(path, callback) {
    let arrFolders = self.getPathAsArray(path);
    //console.log('!' + arrFolders);
    return await _mkdirs(arrFolders, callback, 0);
  };

  let _mkdirs = async function(arrFolders, callback) {

    let parentFolderId = null;
    let lastDoc = null;
    for (let folderName of arrFolders) {
      let doc = await Document.findOne({parentFolderId: parentFolderId, lowerCaseName: folderName.toLowerCase()});
      if (!doc) {
        doc = new Document();
        doc.name = folderName;
        
        doc.parentFolderId = parentFolderId;
        doc.docType = web.cms.constants.folder;
        await doc.save();
      }
      parentFolderId = doc._id;
      lastDoc = doc;
    }

    if (callback) {
      callback(null, lastDoc);
    }

    return lastDoc;
    
  };

}
