/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var menu = Backbone.View.extend(
		{
			//UI
			tagName: "div",
			className: "la-tutor-icon",
			template: "menu-topNavigation",

			initialize: function() {
				this.listenTo(Adapt, 'remove', this.remove);
				var thisHandle = this;
				Adapt.on("learnerassistant:initialized", function() {
					thisHandle.model = Adapt.learnerassistant.model;
				});
			},

			//DRAWING
			render: function() {
				var template = Handlebars.templates[this.template];
				this.$el.html(template(this.model.toJSON()));
				_.defer(_.bind(function() {
					this.postRender();
				}, this));
			},
			
			postRender: function() {
				this.$el.attr("href","#");
				this.undelegateEvents();
				this.delegateEvents();
			},
		
			//EVENTS
			events: {
				'click .title-bar': 'onTutorButtonClick',
				'click .close': 'onEndClick'
			},

			onEndClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:reviewEnd");

			},

			onTutorButtonClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:tutorOpen");
			}
			
		}
	);
	return menu;
})