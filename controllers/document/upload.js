const pluginConf = web.plugins['oils-plugin-braziw-cms'].conf;
const multer = require('multer')
const uploadDir = pluginConf.uploadDir;
const upload = multer({ dest: uploadDir });
const fs = require('fs');
const Document = web.models('Document');
const util = require('util');
const readFile = util.promisify(fs.readFile);

module.exports = {
  enableCsrfToken: false,
  
	post: [upload.any(), async function(req, res) {
    
    try {
      let arrFiles = req.files;
      let parentFolderId = req.body.docId;
      let filenamesUploaded = [];
      if (arrFiles) {
        for (let i=0; i<arrFiles.length; i++) {
          let f = arrFiles[i];
          let doc = new Document();
          doc.content = await readFile(f.path);
          doc.parentFolderId = parentFolderId;

          doc.createBy = req.user._id.toString();
          doc.updateBy = doc.createBy;

          doc.isFolder = false,
          doc.docType = 'file';
          doc.name = f.originalname;
          doc.mimeType = f.mimetype;
          doc.fileSize = f.size;

          await doc.save();

          if (web.conf.isDebug) {
            console.debug('Uploaded', doc.folderPath, doc.name);
          }

          fs.unlink(f.path, function(err) {
            //do nothing
          });
          filenamesUploaded.push(doc.name);

        }
      }

      req.flash('info', 'Uploaded ' + filenamesUploaded.join(', '));
      res.json({"status": 200});
    } catch (ex) {
      console.error(ex);
      res.status(400),json({status: 400, error: ex.message})
    }

      

		
	}]
}

function processFile(doc, f, c) {
  fs.readFile(f.path, function(err, buffer) {
    let doc = new Document();
    doc.data = buffer;
  });
}