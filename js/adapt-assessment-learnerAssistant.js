/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var LearnerassistantModel = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-model');
	var LearnerassistantResultsView = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-resultsView');
	var LearnerassistantNavigationView = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-navigationView');
	var LearnerassistantPageLevelProgressView = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-pageLevelProgressView');
	
	//GLOBAL LEARNERASSISTANT CONTEXT
	var LearnerAssistant = Backbone.View.extend({ //must have view for listento function in pagelevelprogress.attach + detach
		model: new LearnerassistantModel(), //will be a modified copy of the assessment questionModel
		views: {},
		modelSetup: function(questionModel) {
			//Update results view
			this.model.setup(JSON.parse(JSON.stringify(questionModel)))
			
		},
		modelUpdate: function(questionModel) {
			//Update results view
			this.model.update(JSON.parse(JSON.stringify(questionModel)));
		},

		//RESULTS VIEW FUNCTIONS
		results: {
			show: function() {
				//Change rollay view to results view
				Adapt.rollay.setCustomView( LearnerAssistant.views['results'] );
				
				//Reshow the rollay
				Adapt.rollay.hide(0);
				Adapt.rollay.show();
				LearnerAssistant.model.set("isResultsShown", true);
				Adapt.trigger("learnerassistant:resultsopened");
				Adapt.bottomnavigation.render();
			},
			hide: function() {
				Adapt.rollay.hide();
				LearnerAssistant.model.set("isResultsShown", false);
				Adapt.trigger("learnerassistant:resultsclosed");
				Adapt.bottomnavigation.render();
			}
		},

		//PAGELEVELPROGRESS FUNCTIONS
		pagelevelprogress : {
			incrementalMarking: false,
			show: function(duration) {
				//ATTACH PAGELEVELPROGRESS TO QUESTIONS
				LearnerAssistant.pagelevelprogress.attach();
				//SHOW NAVIGATION
				Adapt.bottomnavigation.show(duration);
			},
			hide: function(duration) {
				//DETACH PAGELEVELPROGRESS FROM QUESTIONS
				LearnerAssistant.pagelevelprogress.detach();
				//HIDE NAVIGATION
				Adapt.bottomnavigation.hide(duration);
			},
			attach: function () {
				LearnerAssistant.pagelevelprogress.render();
				var options = LearnerAssistant.model.get("options");
				_.each(options.questions, function(question) {
					LearnerAssistant.listenTo( Adapt.findById(question._id), "change:_isInteractionsComplete", LearnerAssistant.pagelevelprogress.onQuestionInteraction);
				});
			},
			render: function () {
				var view = LearnerAssistant.views['assessment'];
				var c = new Backbone.Collection(view.model.findDescendants('components').filter(function(item) {
		    		return item.get('_isAvailable') && item.get('_pageLevelProgress') && item.get('_pageLevelProgress')._useAssessment;
		    	}));

		    	if (c.length === 0) return;
		    	
		    	var showCompletion = !view.model.get('assessmentModel').get('_isResetOnRevisit') && view.model.get('assessmentModel').get('_quizCompleteInSession');
		    	var assessmentPageLevelProgress = view.model.get('assessmentModel').get('_assessmentPageLevelProgress');
		    	var incrementalMarking = assessmentPageLevelProgress && assessmentPageLevelProgress._incrementalMarking;
		    	var isComplete = view.model.get('_isComplete');
		    	LearnerAssistant.pagelevelprogress.incrementalMarking = incrementalMarking;
		    	var showMarking = assessmentPageLevelProgress && assessmentPageLevelProgress._showMarking;
		    	var showProgress = assessmentPageLevelProgress && assessmentPageLevelProgress._showProgress;
		    	
		    	var opts = {
		    		options: {
		        		collection:c,
		        		showCompletion:showCompletion,
		        		isComplete: isComplete,
		        		incrementalMarking:incrementalMarking,
		        		showMarking:showMarking,
		        		showProgress:showProgress
		    		}
		    	};
		    	console.log(opts);
		        Adapt.bottomnavigation.setCustomView(new LearnerassistantPageLevelProgressView(opts));
		        Adapt.bottomnavigation.render();
			},
			detach: function () {
				var options = LearnerAssistant.model.get("options");
				_.each(options.questions, function(question) {
					LearnerAssistant.stopListening( Adapt.findById(question._id), "change:_isInteractionsComplete");
				});
			},
			onQuestionInteraction: function(model, isInteractionsComplete) {
				//if (LearnerAssistant.pagelevelprogress.incrementalMarking)
				LearnerAssistant.pagelevelprogress.render();
			}
		},

		//LEARNER ASSISTANT NAVIGATION FUNCTIONS
		navigation: {
			show: function(duration) {
				//CHANGE NAVIGATION VIEW TO LEARNING ASSISTANT FROM PAGELEVELPROGRESS
				Adapt.bottomnavigation.setCustomView( LearnerAssistant.views['navigation'] );
				Adapt.bottomnavigation.render();
				Adapt.bottomnavigation.show(duration);
			},
			hide: function(duration) {
				Adapt.bottomnavigation.hide(duration);
			}

		}
	});
	LearnerAssistant = new LearnerAssistant(); //create instance of learnerassistant


	//VIEW INSTANCIATION
	LearnerAssistant.views['results'] = new LearnerassistantResultsView();
	LearnerAssistant.views['results'].parent = LearnerAssistant;
	LearnerAssistant.views['navigation'] = new LearnerassistantNavigationView();
	LearnerAssistant.views['navigation'].parent = LearnerAssistant;
	
	//GLOBAL EVENT LISTENERS
	Adapt.once("bottomnavigation:initialised", function() {
		//SETUP NAVIGATION WITH MODEL
		LearnerAssistant.views['navigation'].model = LearnerAssistant.model;
	});
	Adapt.once("rollay:initialised", function() {
		//SETUP RESULTS WITH MODEL
		LearnerAssistant.views['results'].model = LearnerAssistant.model;
	});
	Adapt.on("rollay:closed", function() {
		//HIDE RESULTS ON ROLLAY HIDE
		LearnerAssistant.results.hide();
	});

	//back button clicked
	Adapt.on("navigation:backButton",  function () { 
		if (!LearnerAssistant.model.get("isComplete")) 
		LearnerAssistant.pagelevelprogress.hide();
	});
	Adapt.on("router:menu", function() {
		if (!LearnerAssistant.model.get("isComplete")) 
		LearnerAssistant.pagelevelprogress.hide();
	});
	Adapt.on("router:page", function() {
		if (!LearnerAssistant.model.get("isComplete")) 
		LearnerAssistant.pagelevelprogress.hide();
	});

	Adapt.on("articleView:postRender", function(view) {

		if (view.model.get("assessmentModel") && view.model.get('assessmentModel').get('_isEnabled')) {
			//CAPTURE ASSESSMENT VIEW
			LearnerAssistant.views['assessment'] = view;

			var questionModel = view.model.get("assessmentModel").getQuestionModel();
			if (!LearnerAssistant.model.get("isComplete") || view.model.get('_assessment')._isResetOnRevisit) {
				//SETUP MODEL FROM ASSESSMENT
				LearnerAssistant.modelSetup.call(LearnerAssistant, questionModel);

				//SHOW APPROPRIATE NAV
				LearnerAssistant.navigation.hide(0);
				LearnerAssistant.pagelevelprogress.show();
			} else {
				//UPDATE THE MODEL
				LearnerAssistant.modelUpdate.call(LearnerAssistant, questionModel);

				//SHOW APPROPRIATE NAV
				LearnerAssistant.pagelevelprogress.hide(0);
				LearnerAssistant.navigation.show();
				
			}

			
		}
	});
	Adapt.on("assessment:complete", function(questionModel) {
		//fired on assessment complete
		LearnerAssistant.model.set("isComplete", true);
		Adapt.trigger('navigation:backButton');

		//HIDE PAGELEVELPROGRESS NAV
		LearnerAssistant.pagelevelprogress.hide(0);

		//UPDATE THE MODEL
		LearnerAssistant.modelUpdate.call(LearnerAssistant, questionModel);

		//CHECK IF SHOWRESULTS REQUIRED
		if (LearnerAssistant.model.get("isPass") && !LearnerAssistant.model.get("isReviewNeeded")) {
			Adapt.bottomnavigation.hide();
			return;
		}

		//SHOW THE RESULTS
		LearnerAssistant.results.show();

		//SHOW ASSIST LEARN NAV
		LearnerAssistant.navigation.show();

	});

	Adapt.on("learnerassistant:interactionComplete", function() {
		//REDRAW LEARNINGASSISTANT NAVIGATION
		LearnerAssistant.model.set("isInteractionsComplete", true);
		LearnerAssistant.views['navigation'].reRender();
	});

	Adapt.on("learnerassistant:complete", function() {
		//REDRAW LEARNINGASSISTANT NAVIGATION
		var alertObject = {
		    title: "Congratulations",
		    body: "You have completed your review. Please take the quiz again!",
		    confirmText: "Take Quiz",
		    _callbackEvent: "learnerassistant:takeQuiz",
		    _showIcon: false
		};

		Adapt.trigger('notify:alert', alertObject);
	});

	Adapt.on("learnerassistant:takeQuiz", function() {
		var id = LearnerAssistant.views['assessment'].model.get("_id");
		var element = Adapt.findById(id)
		var typeNameConversion = {
			"component": "components",
			"article": "articles",
			"block": "blocks",
			"menu": "contentObject",
			"page": "contentObject"
		};
		
		
		Adapt.navigateToElement(id, typeNameConversion[element.get("_type")] );
	});


	return LearnerAssistant;
});