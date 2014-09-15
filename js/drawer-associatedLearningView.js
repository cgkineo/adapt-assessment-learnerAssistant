/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var drawer = Backbone.View.extend(
		{
			//UI
			className: "la-drawer",
			template: "drawer-associatedLearning",

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
			},

			//EVENTS
			events: {
				'click .la-drawer-item.drawer-item a': 'onClickItem'
			},

			onClickItem: function(event) {
				event.preventDefault();

				var id = $(event.currentTarget).attr('data-la-drawer-id');
				Adapt.trigger("learnerassistant:reviewGotoItem", id);

			}

		}
	);
	return drawer;
})