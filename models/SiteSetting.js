module.exports = {
	name: 'SiteSetting',
	schema: {
		name: {type: String, required: true, default: 'site_settings'},
		docType: {type: String, required:true, default: 'SiteSetting'},
		title: {type: String},
		currency: {type: String}
	},
	parentModel: web.cms.conf.models.Document,
	editables: [{"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "title", "type": "text", "label": "Title", "required":true},
  {"name": "currency", "type": "text", "label": "Curreny Symbol", "required":true}
    ]
}