module.exports = function(pluginConf, web) {
  var Document = web.includeModel(pluginConf.models.document);
  var context = pluginConf.context;
  var mongoose = require('mongoose');
  var dmsUtils = web.dms.utils;
  var myRoutes = {

    all: function(req, res) {
      var id = mongoose.Types.ObjectId(req.params.DOC_ID);
      Document.findOne({_id: id}, function(err, doc) {
      	var folderId = '';
      	if (doc.parentFolderId) {
      		folderId = doc.parentFolderId.toString();
      	}
        if (doc) {
        	web.dms.utils.deleteDoc(doc, function(err) {
            if (err) throw err;
            req.flash('info', "Document deleted");
            res.redirect(context + '/document/list?folderId=' + folderId);
          });
        } else {
          req.flash('error', "Document does not exist");
          res.redirect(context + '/document/list?folderId=' + folderId);
        }
        
      })
    }/*,

    onError: function(req, res, err, app) {
      req.flash('error', err.message);
      res.redirect('/dms');
    }*/
  }

  

  return myRoutes;
}


