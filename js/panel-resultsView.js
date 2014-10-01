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
				'click .la-close': 'onCloseClick',
				"click .quizbank.not-passed.not-reviewed": "onQuizBankClick"
			},

			onCloseClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:reviewEnd");


			},

			onQuizBankClick: function(event) {
				event.preventDefault();
				var quizbankid = $(event.currentTarget).attr("quizbankid");
				if (!this.model.get("_state")._isInReview) {
					Adapt.trigger("learnerassistant:reviewBegin", quizbankid);
				} else {
					Adapt.trigger("learnerassistant:reviewNext", quizbankid);
				}
				Adapt.trigger("learnerassistant:quizBankChanged");
			}

		}
	);



	return panel;
});