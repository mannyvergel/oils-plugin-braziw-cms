var Document = web.models('Document');

module.exports = {
	get: function(req, res) {
		var docId = req.query._id;

    if (!docId) {
      throw new Error("Incorrect parameters");
    }

    Document.findOne({_id: docId}, function(err, doc) {
      if (err) {
        throw err;
      }

      if (!doc) {
        throw new Error("Doc not found.");
      }

      res.setHeader('Content-disposition', 'attachment; filename=' + doc.name);
      if (doc.mimeType) {
        res.setHeader('Content-type', doc.mimeType);
      }

      res.end(doc.content);

    })
	}
}