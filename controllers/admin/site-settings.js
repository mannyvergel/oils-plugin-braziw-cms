module.exports = function(pluginConf, web) {

  return {
    get: function(req, res) {

		res.renderFile(pluginConf.pluginPath + '/views/admin/site-settings.html');

    },
    post: function(req, res) {
    	let bodyParams = req.body;
    	let SiteSetting = web.cms.getCmsModel('SiteSetting');
    	SiteSetting.findOne({docType:'SiteSetting'}, function(err, siteSetting) {
    		if (err) throw err;

    		if (!siteSetting) throw new Error('Site Settings not found.');

    		for (let i in bodyParams) {
    			siteSetting[i] = bodyParams[i];
    			siteSetting.save(function(err) {
    				if (err) throw err;

    				web.cms.updateSiteSettingCache();
    				req.flash('info', 'Settings updated successfully.');
    				res.redirect(pluginConf.context + '/site-settings');
    			})
    		}
    	})
    }
  }
}


