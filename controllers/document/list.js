module.exports = function(pluginConf, web) {
  let Document = web.includeModel(pluginConf.models.Document);
  let context = pluginConf.context;
  return {
    get: function(req, res) {
      web.cms.utils.handleFolder(req.query.folderId, req, res, function(err, folder, folderId, parentFolders) {
        let page = req.query.p || '1';
        let numberOfRecordsPerPage = pluginConf.numberOfRecordsPerPage;

        let skip = (page - 1) * numberOfRecordsPerPage;
        
        Document.find({'parentFolderId': folderId}, '', {lean: true, skip: skip, sort:{isFolder: -1, name: 1}}, function(err, documents) {
    
          if (!documents || documents.length == 0) {
            //for swig
            documents = null;
          }
          folderId = folderId || '';
          let folderPath = '';
          for (let i in parentFolders) {
            folderPath = folderPath + '/' + parentFolders[i].name;
          }
          if (folderPath == '') {
            folderPath = '/';
          }

          let options = {
            documents: documents, 
            context: context, 
            folderId: folderId, 
            parentFolders: parentFolders,
            folderPath: folderPath,
            defaultDocTypeForAddFile: null
          };

          web.callEvent('cms.beforeRenderList', [options, req, res])
          res.render(pluginConf.views.list, options);
        })

      })

    }
  }
}


