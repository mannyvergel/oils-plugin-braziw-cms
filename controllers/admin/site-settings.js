//TODO: make site settings obsolete, use syspar

module.exports = function(pluginConf, web) {

  return {
    get: async function(req, res) {
        let SiteSetting = web.cms.getCmsModel('SiteSetting');
        var siteSetting = await SiteSetting.findOne({docType:'SiteSetting'});

        if (!siteSetting) {
            throw new Error("Site setting not found!");
        }

        res.redirect('/admin/document/edit/' + siteSetting._id + '?docType=SiteSetting')

    },
  }
}


