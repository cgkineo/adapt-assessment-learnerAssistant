/*
* Assessment Page Level Progress
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>, Gavin McMaster <gavin.mcmaster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var AssessmentPageLevelProgressView = Backbone.View.extend(
		{
			//UI
			className: "la-assess-prog",
			template: "menu-bottomAssessmentProgress",

			//EVENTS
			events: {
				'click a.la-assess-prog-item': 'onScrollToPageElement',
				'click .la-tutor-button': 'onIconClick'
			},
			onScrollToPageElement: function(event) {
				event.preventDefault();
				var currentComponentSelector = '.' + $(event.currentTarget).attr('data-learnerassistant-page-level-progress-id');
				var $currentComponent = $(currentComponentSelector);
				$(window).scrollTo($currentComponent, {offset:{top:-$('.navigation').height()}});
				Adapt.trigger('page:scrollTo', currentComponentSelector);
			},
			onIconClick: function(event) {
				event.preventDefault();
				var alertObject = {
				    title: Adapt.learnerassistant.model.get('settings')._quizProgressTutorButton.title,
				    body: Adapt.learnerassistant.model.get('settings')._quizProgressTutorButton.body,
				    confirmText: Adapt.learnerassistant.model.get('settings')._quizProgressTutorButton.button,
				    _showIcon: false
				};

				Adapt.trigger('notify:alert', alertObject);
			},

			//DRAWING
			preRender: function() {
				var view = Adapt.learnerassistant.views['assessment'];
				var c = new Backbone.Collection(view.model.findDescendants('components').filter(function(item) {
		    		return item.get('_isAvailable') && item.get('_pageLevelProgress') && item.get('_pageLevelProgress')._useAssessment;
		    	}));

		    	if (c.length === 0) return;
		    	
		    	var assessmentPageLevelProgress = Adapt.learnerassistant.model.get("settings")._assessmentPageLevelProgress;
		    	var incrementalMarking = assessmentPageLevelProgress._incrementalMarking;
		    	var isComplete = Adapt.learnerassistant.model.get('isComplete');
		    	var hideUserAnswer = Adapt.learnerassistant.model.get('hideUserAnswer');
		    	Adapt.learnerassistant.menu.bottomNavigation.assessmentProgress.incrementalMarking = incrementalMarking;
		    	var showInvisible = assessmentPageLevelProgress._showInvisible;
		    	var showProgress = assessmentPageLevelProgress._showProgress;

				var data = c.toJSON();
				data = _.filter(data, function(item) { 
					if (typeof item._learningassistentProgress == "undefined") return true;
					if (typeof item._learningassistentProgress._isEnabled == "undefined") return true;
					return item._learningassistentProgress._isEnabled;
				});
				this.model = {
		        	components:data,
		        	incrementalMarking:incrementalMarking,
		        	showInvisible:showInvisible,
		        	showProgress:showProgress,
		        	isComplete:isComplete,
		        	hideUserAnswer: hideUserAnswer
		        };
			},
			render: function() {
				this.preRender();
				var template = Handlebars.templates[this.template];
				this.$el.html(template(this.model));
			}
		}
	);

	Handlebars.registerHelper('assessmentPageLevelProgressShowMarking', function() {
		if (!this.showMarking) return 'hide-marking';
		var questions = _.filter(this.components, function(item) { return item._questionWeight != undefined; });
		return this.incrementalMarking || _.where(questions, {_isInteractionsComplete:true}).length / questions.length == 1 ? 'show-marking' : 'hide-marking';
	});

	Handlebars.registerHelper('assessmentPageLevelProgressMark', function() {
		if (this._questionWeight != undefined && this._isInteractionsComplete) return this._isCorrect ? 'correct' : 'incorrect';//!!Math.floor(this._numberOfCorrectAnswers / this._items.length) ? 'correct' : 'incorrect';
		return '';
	});

	return AssessmentPageLevelProgressView;
})
