module.exports = function(pluginConf, web) {

  return {
    get: function(req, res) {
      res.render(pluginConf.pluginPath + '/views/admin/dashboard.html');

    }
  }
}


