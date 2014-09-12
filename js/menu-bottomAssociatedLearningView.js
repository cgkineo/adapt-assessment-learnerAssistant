/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	require('extensions/adapt-assessment-learnerAssistant/js/_hacks');

	var menu = Backbone.View.extend(
		{
			//UI
			className : "la-bottom-assoc-learn",
			template : "menu-bottomAssociatedLearning",

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
			events: {
				"click #la-revision" : "onBeginRevisionClick",
				"click #la-continue" : "onNextClick",
				"click #la-end" : "onEndClick",
				"click #la-next" : "onNextClick",
				"click #la-improve" : "onImproveClick",
				"click #la-finish" : "onNextClick",
				"click #la-print" : "onPrintClick",
				"click .la-navigation-completion-container" : "onProgressClick",
				"click .la-tutor-button" : "onTutorButtonClick"
			},

			onBeginRevisionClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:reviewBegin");		
			},
			
			onNextClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:reviewNext");
			},

			onProgressClick: function(event) {
				event.preventDefault();

				Adapt.learnerassistant.drawer.associatedLearning.show();

			},

			onEndClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:reviewEnd");
				
			},

			onTutorButtonClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:tutorOpen");

			},

			onPrintClick: function(event) {
				event.preventDefault();
				
				Adapt.trigger("learnerassistant:print");
			},

			onImproveClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:resultsOpen");
			}
		}
		
	);

	

	return menu;
})