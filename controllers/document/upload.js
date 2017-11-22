var pluginConf = web.plugins['oils-plugin-braziw-cms'].conf;
var multer = require('multer')
var uploadDir = pluginConf.uploadDir;
var upload = multer({ dest: uploadDir });
var fs = require('fs');
var Document = web.models('Document');


var sync = require('synchronize');
sync(fs, 'readFile');
module.exports = {
	post: [upload.any(), function(req, res) {
    sync.fiber(function() {
      try {
        var arrFiles = req.files;
        var parentFolderId = req.body.docId;

        if (arrFiles) {
          for (var i=0; i<arrFiles.length; i++) {
            var f = arrFiles[i];
            var doc = new Document();
            doc.content = fs.readFile(f.path);
            doc.parentFolderId = parentFolderId;

            doc.meta = {
              lastUpdateBy: req.user._id.toString(),
              createBy: req.user._id.toString()
            }
            doc.isFolder = false,
            doc.docType = 'file';
            doc.name = f.originalname;
            doc.mimeType = f.mimetype;
            doc.fileSize = f.size;

            sync.await(doc.save(sync.defer()));

            if (web.conf.isDebug) {
              console.debug('Uploaded', doc.folderPath, doc.name);
            }

            fs.unlink(f.path);
            //TODO: mime type!!!
            //console.log('!!!!', arrFiles[i]);
          }
        }
        res.json({"status": 200});
      } catch (ex) {
        console.error(ex);
        res.status(400),json({status: 400, error: ex.message})
      }

      
    })
		
	}]
}

function processFile(doc, f, c) {
  fs.readFile(f.path, function(err, buffer) {
    var doc = new Document();
    doc.data = buffer;
  });
}