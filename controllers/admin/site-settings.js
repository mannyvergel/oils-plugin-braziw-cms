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

		//res.renderFile(pluginConf.pluginPath + '/views/admin/site-settings.html');

    },
    // post: function(req, res) {
    // 	let bodyParams = req.body;
    // 	let SiteSetting = web.cms.getCmsModel('SiteSetting');
    // 	SiteSetting.findOne({docType:'SiteSetting'}, function(err, siteSetting) {
    // 		if (err) throw err;

    // 		if (!siteSetting) throw new Error('Site Settings not found.');

    // 		for (let i in bodyParams) {
    // 			siteSetting[i] = bodyParams[i];
    // 			siteSetting.save(function(err) {
    // 				if (err) throw err;

    // 				web.cms.updateSiteSettingCache();
    // 				req.flash('info', 'Settings updated successfully.');
    // 				res.redirect(pluginConf.context + '/site-settings');
    // 			})
    // 		}
    // 	})
    // }
  }
}


