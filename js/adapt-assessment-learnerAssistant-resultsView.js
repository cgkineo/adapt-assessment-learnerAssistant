/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var RollayView = require('extensions/adapt-rollay/js/rollayView');

	var LearnerassistantResultsView = RollayView.extend(
		{
			//UI
			className : "learnerassistant-resultsView",
			template : "learnerassistant-resultsView",
			postRender: function() {
				//update filter buttons
				this.$el.find(".learnerassistant-resultsView-filter a").removeClass("selected");
				this.$el.find(".learnerassistant-resultsView-filter a[data-filter='" + this.model.options.filter + "']").addClass("selected");
			}
		},
		{
			//INTERACTION
			events : {
				'click .learnerassistant-close': 'onCloseClick',
				'click a[data-filter]': 'onFilterClick'
			},
			onCloseClick: function(event) {
				event.preventDefault();
				Adapt.rollay.hide();
			},
			onFilterClick: function(event) {
				event.preventDefault();
				$currentTarget = $(event.currentTarget);
				
				this.options.filter = $currentTarget.attr("data-filter");
				this.options.selectedQuestions = this.options.questions[this.options.filter]
				
				this.reRender();
			}
		},
		{
			//MODEL
			model: {
				data: null,
				options: null
			},
			options: {
				questions: {
					"all": null,
					"failed": null,
					"passed": null
				},
				filter: "all"
			},
			modelUpdate: function(data) {
				//pick out passed and failed questions and set default filter
				this.model.data = data;
				this.model.options = this.options;
				this.options.questions['all'] = _.values(data.allQuestions);
				this.options.questions['failed'] = _.filter(data.allQuestions, function(item) { return typeof item._isCorrect == "undefined" || item._isCorrect === false; });
				this.options.questions['passed'] = _.filter(data.allQuestions, function(item) { return typeof item._isCorrect !== "undefined" && item._isCorrect === true; });
				
				this.options.filter = "failed";
				this.options.selectedQuestions = this.options.questions[this.options.filter];
				
			}
		}
	);

	return LearnerassistantResultsView;
})