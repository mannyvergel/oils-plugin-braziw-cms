module.exports = function(pluginConf, web) {

  return {
    get: function(req, res) {
      res.renderFile(pluginConf.pluginPath + '/views/admin/dashboard.html');

    }
  }
}


