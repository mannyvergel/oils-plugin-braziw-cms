module.exports = function(pluginConf, web) {
  var Document = web.includeModel(pluginConf.models.Document);
  var context = pluginConf.context;
  return {
    get: function(req, res) {
      web.cms.utils.handleFolder(req.query.folderId, req, res, function(err, folder, folderId, parentFolders) {
        var page = req.query.p || '1';
        var numberOfRecordsPerPage = pluginConf.numberOfRecordsPerPage;

        var skip = (page - 1) * numberOfRecordsPerPage;
        
        Document.find({'parentFolderId': folderId}, '', {lean: true, skip: skip, sort:{isFolder: -1, name: 1}}, function(err, documents) {
    
          if (!documents || documents.length == 0) {
            //for swig
            documents = null;
          }
          folderId = folderId || '';
          var folderPath = '';
          for (var i in parentFolders) {
            folderPath = folderPath + '/' + parentFolders[i].name;
          }
          if (folderPath == '') {
            folderPath = '/';
          }

          var options = {
            documents: documents, 
            context: context, 
            folderId: 
            folderId, 
            parentFolders: parentFolders,
            folderPath: folderPath,
            defaultDocTypeForAddFile: null
          };

          web.callEvent('cms.beforeRenderList', [options, req, res])
          res.renderFile(pluginConf.views.list, options);
        })

      })

    }
  }
}


