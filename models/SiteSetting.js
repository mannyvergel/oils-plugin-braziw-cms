//TODO: make this OBOSOLETE, use syspars instead in the future

module.exports = {
	name: 'SiteSetting',
	schema: {
		name: {type: String, required: true, default: 'site_settings'},
		docType: {type: String, required:true, default: 'SiteSetting'},
		title: {type: String}
	},
  initSchema: function(mySchema) {

    mySchema.post('save', function() {
      //no next() for post save
      if (this.docType == 'SiteSetting') {
        web.cms.updateSiteSettingCache();
      }
    })
    
  },
	parentModel: web.cms.conf.models.Document,
	editables: [
    {"name": "title", "type": "text", "label": "Site Title", "required":true},
  ]
}