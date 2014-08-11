/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var panel = Backbone.View.extend(
		{
			//UI
			className : "la-results",
			template : "panel-results",

			initialize: function() {
				var thisHandle = this;
				Adapt.on("learnerassistant:initialized", function() {
					thisHandle.model = Adapt.learnerassistant.model;
				});
			},

			//DRAWING
			render: function() {
				var template = Handlebars.templates[this.template];
				this.$el.html(template(this.model.toJSON()));
			},

			//EVENTS
			events : {
				'click .la-close': 'onCloseClick'
			},

			onCloseClick: function(event) {
				event.preventDefault();

				Adapt.learnerassistant.panel.results.hide();

			}

		}
	);



	return panel;
});