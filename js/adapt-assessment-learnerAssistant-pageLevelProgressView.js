/*
* Assessment Page Level Progress
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>, Gavin McMaster <gavin.mcmaster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');
	var NavigationView = require('extensions/adapt-bottomnavigation/js/bottomnavigationView');

	var AssessmentPageLevelProgressView = NavigationView.extend(
		{
			//UI
			className: "learnerassistant-page-level-progress",
			template: "learnerassistant-PageLevelProgressView"

		},
		{
			//EVENTS
			events: {
				'click a.learnerassistant-page-level-progress-item': 'onScrollToPageElement'
			},
			onScrollToPageElement: function(event) {
				event.preventDefault();
				var currentComponentSelector = '.' + $(event.currentTarget).attr('data-learnerassistant-page-level-progress-id');
				var $currentComponent = $(currentComponentSelector);
				$(window).scrollTo($currentComponent, {offset:{top:-$('.navigation').height()}});
				Adapt.trigger('page:scrollTo', currentComponentSelector);
			}
		},
		{
			initialize: function() {
				//this.listenTo(Adapt, 'remove', this.remove);
				if(this.options.showCompletion) this.setComponentsStatusByCompletion();
				var data = this.collection.toJSON();
				this.model = {
		        	components:data,
		        	showCompletion:this.options.showCompletion,
		        	incrementalMarking:this.options.incrementalMarking,
		        	showMarking:this.options.showMarking,
		        	showProgress:this.options.showProgress
		        };
			},
			setComponentsStatusByCompletion: function() {
				_.each(this.collection.models, function(component){
					if(component.get('_isComplete') !== component.get('_isInteractionsComplete')) 
						component.set('_isInteractionsComplete', component.get('_isComplete'));
				})
			}
		}
	);

	Handlebars.registerHelper('assessmentPageLevelProgressShowMarking', function() {
		if (!this.showMarking) return 'hide-marking';
		var questions = _.filter(this.components, function(item) { return item._questionWeight != undefined; });
		return this.incrementalMarking || _.where(questions, {_isInteractionsComplete:true}).length / questions.length == 1 ? 'show-marking' : 'hide-marking';
	});

	Handlebars.registerHelper('assessmentPageLevelProgressMark', function() {
		if (this._questionWeight != undefined && this._isInteractionsComplete) return !!Math.floor(this._numberOfCorrectAnswers / this._items.length) ? 'correct' : 'incorrect';
		return '';
	});

	return AssessmentPageLevelProgressView;
})
