/*
 * adapt-contrib-pageLevelProgress
 * License - https://github.com/adaptlearning/adapt_framework/blob/master/LICENSE
 * Maintainers - Daryl Hedley <darylhedley@hotmail.com>, Himanshu Rajotia <himanshu.rajotia@credipoint.com>
 */
define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var ProgressDrawerView = Backbone.View.extend(
		{
			//UI
			className: "la-drawer",
			template: "drawer-associatedLearning",
			initialize: function() {
				this.listenTo(Adapt, 'remove', this.remove);
			},

			//EVENTS
			events: {
				'click .la-drawer-item.drawer-item a': 'onScrollToPageElement'
			},

			onScrollToPageElement: function(event) {
				event.preventDefault();
				Adapt.learnerassistant.model.set("isInReview", true);
				var id = $(event.currentTarget).attr('data-la-drawer-id');
				var assoc = _.findWhere(this.model.associatedLearning, { _id: id });
				if (assoc._isInteractionsComplete) Adapt.learnerassistant.model.set("isInteractionsComplete", true);
				else Adapt.learnerassistant.model.set("isInteractionsComplete", false);
				var element = Adapt.findById(id);
				Adapt.trigger('drawer:closeDrawer');
				Adapt.learnerassistant.onNavigateToId(id);
			},

			//DRAWING
			render: function() {
				var components  = [];
				_.each(Adapt.learnerassistant.model.get("associatedLearning"), function(assoc) {
					var component = Adapt.findById(assoc._id).toJSON();
					//_.each(block.getChildren().toJSON(), function(component) {
						components.push({
							_id: component._id,
							title: component.title,
							_isInteractionsComplete:  (assoc._interactions > 0)
						});
					//});
					
				});
				this.model = { associatedLearning: components, settings: Adapt.learnerassistant.model.get("settings") };
		        
				var template = Handlebars.templates[this.template];
				this.$el.html(template(this.model));
			}
		}
	);
	return ProgressDrawerView;
})