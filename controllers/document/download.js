const Document = web.models('Document');

module.exports = {
  get: function(req, res) {
    let docId = req.query._id;

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

      web.utils.downloadBuffer(doc.content, doc.name, res, doc.mimeType)

    })
  }
}