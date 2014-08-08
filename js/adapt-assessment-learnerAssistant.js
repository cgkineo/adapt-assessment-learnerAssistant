/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	require('extensions/adapt-assessment-learnerAssistant/js/_hacks');

	var LAModel = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-model');
	var LADrawerAssocLearn =  require('extensions/adapt-assessment-learnerAssistant/js/drawer-associatedLearningView');
	var LABottomAssessProg = require('extensions/adapt-assessment-learnerAssistant/js/menu-bottomAssessmentProgressView');
	var LABottomAssocLearn = require('extensions/adapt-assessment-learnerAssistant/js/menu-bottomAssociatedLearningView');
	var LATopNav = require('extensions/adapt-assessment-learnerAssistant/js/menu-topNavigationView');
	var LAPanelCert = require('extensions/adapt-assessment-learnerAssistant/js/panel-certificateView');
	var LAPanelRes = require('extensions/adapt-assessment-learnerAssistant/js/panel-resultsView');

	//GLOBAL LEARNERASSISTANT CONTEXT
	var learnerassistant = new (Backbone.View.extend({ //must be a view for listento function in pagelevelprogress.attach + detach

		//PUBLIC VARIABLES
		model: new LAModel(), //a modified copy of the assessment.getQuestionModel() model
		views: {
			'drawer-assoclearn': new LADrawerAssocLearn(),
			'menu-bottomassessprog': new LABottomAssessProg(),
			'menu-bottomassoclearn': new LABottomAssocLearn(),
			'menu-topnavigation': new LATopNav(),
			'panel-certificate': new LAPanelCert(),
			'panel-results': new LAPanelRes()
		},

		onNavigateToId: function(id) {

			var element = Adapt.findById(id)
			var typeNameConversion = {
				"component": "components",
				"article": "articles",
				"block": "blocks",
				"menu": "contentObject",
				"page": "contentObject"
			};
			learnerassistant.model.set("currentAssociatedLearningID", id);
			id = ifIdOffsetHiddenReturnParentId(id);

			function complete() {

					Adapt.navigateToElement("." + id, typeNameConversion[element.get("_type")] );

					Adapt.bottomnavigation.render();
			}

			if (this.model.get("isResultsShown")) learnerassistant.panel.results.hide(complete());
			else complete()

		},

		onNavigateToMainMenu: function() {

			var parentId = Adapt.findById(learnerassistant.views['assessment'].model.get("_parentId")).get("_parentId");

			if (parentId == "course") {

				//BUG: showing cover menu
				Backbone.history.navigate("#", {trigger: true, replace: true});

			} else { 

				Backbone.history.navigate("#/id/" + parentId, {trigger: true, replace: true});

			}
		},

		onNavigateAway: function() {

			 learnerassistant.menu.bottomNavigation.assessmentProgress.hide();

		},

		menu: {

			topNavigation: {

				show: function() {

					$(".navigation-inner").append( learnerassistant.views['menu-topnavigation'].$el );
					
					learnerassistant.views['menu-topnavigation'].render();

					learnerassistant.model.set("isMenuTopShown", true);
				},

				hide: function() {

					learnerassistant.views['menu-topnavigation'].$el.remove();

					learnerassistant.model.set("isMenuTopShown", false);

				}

			},

			bottomNavigation: {
				//PAGELEVELPROGRESS FUNCTIONS
				assessmentProgress : {

					incrementalMarking: false,

					show: function(duration) {
						
						//ATTACH PAGELEVELPROGRESS TO QUESTIONS
						var options = learnerassistant.model.get("options");
						_.each(options.questions, function(question) {
							learnerassistant.listenTo( Adapt.findById(question._id), "change:_isInteractionsComplete", function(model, isInteractionsComplete) {
								Adapt.bottomnavigation.render();
							});
						});

						//SHOW NAVIGATION
						Adapt.bottomnavigation.setCustomView(learnerassistant.views['menu-bottomassessprog']);
						Adapt.bottomnavigation.render();
						Adapt.bottomnavigation.show(duration);
						Adapt.bottomnavigation.showMobile(false);
						
						learnerassistant.model.set("isMenuBottomShown", true);
						learnerassistant.model.set("isMenuBottomAssessmentProgressShown", true);
						learnerassistant.model.set("isMenuBottomAssociatedLearningShown", false);
						learnerassistant.model.set("menuBottom", "assessmentProgress");
					},

					hide: function(duration) {

						//DETACH PAGELEVELPROGRESS FROM QUESTIONS
						var options = learnerassistant.model.get("options");
						_.each(options.questions, function(question) {
							learnerassistant.stopListening( Adapt.findById(question._id), "change:_isInteractionsComplete");
						});

						//HIDE NAVIGATION
						Adapt.bottomnavigation.hide(duration);

						learnerassistant.model.set("isMenuBottomShown", false);
						learnerassistant.model.set("isMenuBottomAssessmentProgressShown", false);
						learnerassistant.model.set("isMenuBottomAssociatedLearningShown", false);
						learnerassistant.model.set("menuBottom", "none");
					}
				},

				//LEARNER ASSISTANT NAVIGATION FUNCTIONS
				associatedLearning: {

					show: function(duration) {

						//CHANGE NAVIGATION VIEW TO LEARNING ASSISTANT FROM PAGELEVELPROGRESS
						Adapt.bottomnavigation.setCustomView( learnerassistant.views['menu-bottomassoclearn'] );
						Adapt.bottomnavigation.render();
						Adapt.bottomnavigation.show(duration);
						Adapt.bottomnavigation.showMobile(true);

						$(".navigation-inner").addClass("no-pageLevelProgress");

						learnerassistant.model.set("isMenuBottomShown", true);
						learnerassistant.model.set("isMenuBottomAssessmentProgressShown", false);
						learnerassistant.model.set("isMenuBottomAssociatedLearningShown", true);
						learnerassistant.model.set("menuBottom", "associatedLearning");
					},

					hide: function(duration) {

						Adapt.bottomnavigation.hide(duration);
						$(".navigation-inner").removeClass("no-pageLevelProgress");

						learnerassistant.model.set("isMenuBottomShown", false);
						learnerassistant.model.set("isMenuBottomAssessmentProgressShown", false);
						learnerassistant.model.set("isMenuBottomAssociatedLearningShown", false);
						learnerassistant.model.set("menuBottom", "none");
					}

				}
			}

		},

		panel: {
			//RESULTS VIEW FUNCTIONS
			results: {

				show: function(callback) {
			
					Adapt.rollay.forceShow(true);

					learnerassistant.model.set("isResultsShown", true);
					learnerassistant.model.set("isCertificateShown", false);

					learnerassistant.views['menu-topnavigation'].render();

					//CHANGE ROLLAY VIEW TO RESULTS VIEW
					Adapt.rollay.setCustomView( learnerassistant.views['panel-results'] );

					Adapt.rollay.render();
					Adapt.rollay.show(function() {

						//learnerassistant.views['menu-topnavigation'].render();

						Adapt.trigger("learnerassistant:resultsopened");
						Adapt.bottomnavigation.render();
						if (typeof callback == "function") callback();
					});
					//
					//Adapt.bottomnavigation.render();
				},

				hide: function(callback) {
					Adapt.rollay.forceShow(false);

					learnerassistant.model.set("isResultsShown", false);
					learnerassistant.model.set("isCertificateShown", false);

					Adapt.rollay.hide(function() {
						
						learnerassistant.views['menu-topnavigation'].render();

						Adapt.trigger("learnerassistant:resultsclosed");
						Adapt.bottomnavigation.render();
						if (typeof callback == "function") callback();
					});
					//
					//Adapt.bottomnavigation.render();
				}

			},

			//CERTIFICATE VIEW FUNCTIONS
			certificate: {

				show: function(callback) {
					//CHANGE ROLLAY VIEW TO CERTIFICATE VIEW
					Adapt.rollay.forceShow(true);
					learnerassistant.model.set("isResultsShown", false);
					learnerassistant.model.set("isCertificateShown", true);
					learnerassistant.views['menu-topnavigation'].render();
					Adapt.rollay.setCustomView( learnerassistant.views['panel-certificate'] );
					
					//RESHOW ROLLAY
					Adapt.rollay.render();
					Adapt.rollay.show(function() {
						learnerassistant.views['menu-topnavigation'].render();
						Adapt.trigger("learnerassistant:certificateopened");
						Adapt.bottomnavigation.render();
						if (typeof callback == "function") callback();
					});
				},

				hide: function(callback) {
					learnerassistant.model.set("isResultsShown", false);
					learnerassistant.model.set("isCertificateShown", false);
					Adapt.rollay.hide(function() {
						learnerassistant.views['menu-topnavigation'].render();
						Adapt.trigger("learnerassistant:certificateclosed");
						Adapt.bottomnavigation.render();
						if (typeof callback == "function") callback();
					});
					//
				}

			}

		},

		//LEANER ASSISTANT DRAWER FUNCTIONS
		drawer: {

			associatedLearning: {

				show: function() {
					Adapt.rollay.forceShow(true);
					
					if (typeof learnerassistant.views['drawer-assoclearn'].render == "function") learnerassistant.views['drawer-assoclearn'].render();

					learnerassistant.views['drawer-assoclearn'].undelegateEvents();

					Adapt.drawer.triggerCustomView(learnerassistant.views['drawer-assoclearn'].$el, false);

					learnerassistant.views['drawer-assoclearn'].delegateEvents();
				}

			}

		}
	}))();
	//learnerassistant = new learnerassistant(); //create instance of learnerassistant

	Handlebars.registerHelper('learnerAssistantSettings', function() {
		var settings = learnerassistant.model.get("settings");
		var rtn = eval(arguments[0]);
		return rtn;
	});

	//NAVIGATE AWAY
		//HIDE RESULTS ON ROLLAY HIDE
		//HIDE CERTIFICATE ON ROLLAY HIDE
		Adapt.on("rollay:closed", function() {
			learnerassistant.panel.results.hide();
			learnerassistant.panel.certificate.hide();
		});
		//BACK BUTTON CLICKED
		Adapt.on("navigation:backButton",  function () { 
			if (!learnerassistant.model.get("isComplete")) learnerassistant.onNavigateAway();
		});
		//CHANGE TO MENU DISPLAY
		Adapt.on("router:menu", function() {
			if (!learnerassistant.model.get("isComplete")) learnerassistant.onNavigateAway();
		});
		//CHANGE TO PAGE DISPLAY
		Adapt.on("router:page", function(model) {
			if (!learnerassistant.model.get("isComplete") && model.get("_assessment") !== undefined) learnerassistant.onNavigateAway();
		});

	//ASSESSMENT
		//RUNNING
		Adapt.on("articleView:postRender", function(view) {

			if (view.model.get("assessmentModel") && view.model.get('assessmentModel').get('_isEnabled')) {
				//CAPTURE ASSESSMENT VIEW
				learnerassistant.views['assessment'] = view;

				learnerassistant.model.set("hideUserAnswer", view.model.get('_assessment')._hideUserAnswer)
				
				Adapt.on("componentView:postRender", function(view) {
					var blockId = view.model.get("_parentId");
					var articleId = Adapt.findById(blockId).get("_parentId");
					var article = Adapt.findById(articleId);

					if (article.get("assessmentModel") && article.get('assessmentModel').get('_isEnabled')) {
						view.$el.find(".buttons-action").one("click", 
								function() {
									if (learnerassistant.model.get("isReviewNeeded")) return;
									setTimeout(learnerassistant.menu.bottomNavigation.assessmentProgress.onQuestionInteraction, 500) 
								}
							);
					}

				});

				var questionModel = view.model.get("assessmentModel").getQuestionModel();
				if (!learnerassistant.model.get("isComplete")) {//} || view.model.get('_assessment')._isResetOnRevisit) {
					//SETUP MODEL FROM ASSESSMENT
					learnerassistant.model.setup(questionModel);

					//SHOW APPROPRIATE NAV (PAGELEVELPROGRESS)
					learnerassistant.menu.bottomNavigation.associatedLearning.hide(0);
					learnerassistant.menu.bottomNavigation.assessmentProgress.show();

					Adapt.trigger("learnerassistant:initialized");
				} else {
					//UPDATE THE MODEL
					learnerassistant.model.update(questionModel);

					//SHOW APPROPRIATE NAV (NAVIGATION)
					learnerassistant.menu.bottomNavigation.assessmentProgress.hide(0);
					learnerassistant.menu.bottomNavigation.associatedLearning.show();
				}

				view.setReadyStatus();
			}
		});

		//COMPLETE
		Adapt.on("assessment:complete", function(questionModel) {
			//FIRED ON ASSESSMENT COMPLETE
			learnerassistant.model.set("isComplete", true);
			
			//UPDATE THE MODEL
			learnerassistant.model.update(questionModel);

			//RERENDER BOTTOM NAVIGATION (PAGELEVELPROGRESS)
			Adapt.bottomnavigation.render();

			var settings = learnerassistant.model.get("settings");

			//CHECK IF SHOWRESULTS REQUIRED
			if (learnerassistant.model.get("isPass") ) { //&& !learnerassistant.model.get("isReviewNeeded")) {
				//Adapt.trigger("learnerassistant:guidedlearningOff");
				learnerassistant.model.set("isResultsShown", false);
				learnerassistant.model.set("isCertificateShown", true);
				learnerassistant.views['menu-topnavigation'].render();
				Adapt.trigger("learnerassistant:guidedlearningOn");
				if (!settings._beforeRevision._show) {
					Adapt.trigger("learnerassistant:showCertificate");
				} else {
					var alertObject = {
					    title: settings._beforeCertificate.title,
					    body: settings._beforeCertificate.youScored + learnerassistant.model.get("data").scoreAsPercent + settings._beforeCertificate.body,
					    confirmText: settings._beforeCertificate.button,
					    _callbackEvent: "learnerassistant:showCertificate",
					    _showIcon: false
					};

					Adapt.trigger('notify:alert', alertObject);
				}
				return;
			}

			learnerassistant.model.set("isResultsShown", true);
			learnerassistant.model.set("isCertificateShown", false);
			learnerassistant.views['menu-topnavigation'].render();
			Adapt.trigger("learnerassistant:guidedlearningOn");
			if (!settings._beforeRevision._show) {
				Adapt.trigger("learnerassistant:showResults");
			} else {
				var alertObject = {
				    title: settings._beforeRevision.title,
				    body: settings._beforeRevision.body,
				    confirmText: settings._beforeRevision.button,
				    _callbackEvent: "learnerassistant:showResults",
				    _showIcon: false
				};

				Adapt.trigger('notify:alert', alertObject);
			}
		});

		Adapt.on("learnerassistant:showCertificate", function() {
			//HIDE PAGELEVELPROGRESS NAV
			learnerassistant.menu.bottomNavigation.assessmentProgress.hide(0);

			//MOVE BACK TO MAIN MENU
			learnerassistant.onNavigateToMainMenu();

			//SHOW THE RESULTS
			learnerassistant.panel.certificate.show();
			learnerassistant.menu.bottomNavigation.associatedLearning.show();


			
		});
		Adapt.on("learnerassistant:showResults", function() {
			

			//HIDE PAGELEVELPROGRESS NAV
			learnerassistant.menu.bottomNavigation.assessmentProgress.hide(0);

			//MOVE BACK TO MAIN MENU
			learnerassistant.onNavigateToMainMenu();

			//SHOW THE RESULTS
			learnerassistant.panel.results.show();

			//SHOW ASSIST LEARN NAV
			learnerassistant.menu.bottomNavigation.associatedLearning.show();
		});

	//REVIEW MODE
		//BLOCK COMPLETE
		Adapt.on("learnerassistant:interactionComplete", function(model) {
			//FIRED WHEN EACH BLOCK IN REVIEW IS COMPLETED

			//SET NEXT BUTTON ENABLED
			if (model.get("_id") == learnerassistant.model.get("currentAssociatedLearningID")) {
				learnerassistant.model.set("isInteractionsComplete", true);
			}

			//RERENDER BOTTOM NAVIGATION (NAVIGATION)
			Adapt.bottomnavigation.render();
			if (typeof learnerassistant.views['drawer-assoclearn'].render == "function") learnerassistant.views['drawer-assoclearn'].render();
		});

		//REVIEW COMPLETE
		Adapt.on("learnerassistant:complete", function() {
			//FIRED WHEN REVIEW COMPLETE
			
		});
		Adapt.on("learnerassistant:takeQuiz", function() {
			learnerassistant.panel.results.hide();
			learnerassistant.model.set("isComplete", false);
			learnerassistant.model.set("_isGuidedLearningMode", false);
			$("html").removeClass("guided-learning-mode");
			learnerassistant.views['menu-topnavigation'].$el.remove();

			var id = learnerassistant.views['assessment'].model.get("_id");
			var element = Adapt.findById(id)
			var typeNameConversion = {
				"component": "components",
				"article": "articles",
				"block": "blocks",
				"menu": "contentObject",
				"page": "contentObject"
			};
			
			Adapt.navigateToElement(id, typeNameConversion[element.get("_type")] );

			learnerassistant.menu.bottomNavigation.assessmentProgress.show();
		});

	//REVIEWMODE ON/OFF
		Adapt.on("learnerassistant:guidedlearningOn", function() {
			learnerassistant.model.set("_isGuidedLearningMode", true);
			$("html").addClass("guided-learning-mode");
			
			learnerassistant.menu.topNavigation.show();

		});
		Adapt.on("learnerassistant:gracefullQuit", function() {
			 _.delay(function() {
	           	Adapt.trigger("learnerassistant:guidedlearningOff");
	           	learnerassistant.onNavigateToMainMenu();
	        }, 300);
		});
		Adapt.on("learnerassistant:guidedlearningOff", function() {
			learnerassistant.panel.results.hide();
			learnerassistant.model.set("_isGuidedLearningMode", false);
			$("html").removeClass("guided-learning-mode");
			learnerassistant.menu.bottomNavigation.associatedLearning.hide();
			
			learnerassistant.menu.topNavigation.hide();

		});

	//REDIRECT MENU
		Adapt.on('menuView:postRender', function(menuView) {
			if (menuView.model.get("_learnerassistant") === undefined || menuView.model.get("_learnerassistant")._redirectOnPassed === false) return;

			//IF ASSESSMENT VIEW IS CAPTURED
			if (learnerassistant.views['assessment'] === undefined) return;

			//GET ASSESSMENT PAGE ID
			var pageId = learnerassistant.views['assessment'].model.get("_parentId");

			//IF THIS MENU == ASSESSMENT MENU
			if (pageId !== menuView.model.get("_id")) return;

			//IF IS PASSED
			if (!learnerassistant.model.get("isPass")) return;

			var menuItem = menuView.$el;

			menuItem.off("click");

			menuItem.on("click", function(event) {
				event.preventDefault();
				Adapt.trigger("learnerassistant:guidedlearningOn");
				Adapt.trigger("learnerassistant:showCertificate");
			});

			
			

		});

	window.CompleteAssessment = function() {
		var assessmentView = Adapt.articles.find(function(it) { return typeof it.get('_assessment') !== "undefined"; } );
		Adapt.navigateToElement(assessmentView.get("_id"));
		setTimeout( function () {
			Adapt.trigger("assessment:complete", assessmentView.get("assessmentModel").getQuestionModel());
		}, 1000);
	};
	window.CompleteAssessmentPassed = function() {
		var assessmentView = Adapt.articles.find(function(it) { return typeof it.get('_assessment') !== "undefined"; } );
		Adapt.navigateToElement(assessmentView.get("_id"));
		var questionModel = assessmentView.get("assessmentModel").getQuestionModel();
		_.each(questionModel.allQuestions, function(question) {
			question._isCorrect = true;
		});
		questionModel.isPass = true;
		questionModel.scoreAsPercent = 100;
		setTimeout( function () {
			Adapt.trigger("assessment:complete", questionModel);
			Adapt.bottomnavigation.render();
		}, 1000);
	}

	Adapt.learnerassistant = learnerassistant;

});