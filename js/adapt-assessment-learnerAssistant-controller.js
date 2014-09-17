/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');

	//LOAD PUBLIC INTERFACE
	var learnerassistant = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-public');

	//CAPTURE STATE AND SETTINGS VARIABLES
	var _state = learnerassistant.model.get("_state");
	var _learnerassistant = learnerassistant.model.get("_learnerassistant");
	var _associatedlearning =  learnerassistant.model.get('_associatedlearning');
	var _skipNavigateAway = false;


	//NAVIGATE AWAY GLOBAL TRIGGERS
		//SCROLL AWAY
	$(window).on("scroll", function() {

			var isInReview = _state._isInReview;
			var isInitialised = _state._isInitialised;
			
			if ( isInReview  && isInitialised ) Adapt.trigger("learnerassistant:navigateAway");

		});

		//BACK BUTTON CLICKED OR CHANGE TO MENU SCREEN
	Adapt.on("router:menu",  function () { 

			var isInReview = _state._isInReview;
			var isInAssessment = _state._isInAssessment;
			var isInitialised = _state._isInitialised;
			var isPanelResultsShown = _state._isPanelResultsShown;
			var isPanelCertificateShown = _state._isPanelCertificateShown;

				if ( _state._isMenuBottomAssessmentProgressShown ) learnerassistant.menu.bottomNavigation.assessmentProgress.hide();
			if ( (isInAssessment && isInitialised) || (isInReview && isInitialised) || (isPanelResultsShown && isInitialised) ||(isPanelCertificateShown && isInitialised)  ) Adapt.trigger("learnerassistant:navigateAway");


		})

		//CHANGE TO ANOTHER PAGE
	.on("router:page", function(model) {

			var isInReview = _state._isInReview;
			var isAssessmentPage = model.get("_assessment") !== undefined;
			var isInitialised = _state._isInitialised;
			var isPanelResultsShown = _state._isPanelResultsShown;
			var isPanelCertificateShown = _state._isPanelCertificateShown;

			if ( _state._isMenuBottomAssessmentProgressShown ) learnerassistant.menu.bottomNavigation.assessmentProgress.hide();
			if ( (isAssessmentPage && isInitialised) || (isInReview && isInitialised) ||  ((isPanelResultsShown || isPanelCertificateShown) && isInitialised)  ) Adapt.trigger("learnerassistant:navigateAway");

		})

		//ROLLAY HIDE
	.on("rollay:closed", function() {

			if (!_state._isPanelCertificateShown && !_state._isPanelResultsShown) return;

			learnerassistant.panel.results.hide();
			learnerassistant.panel.certificate.hide();

		})

	.on("popup:closed", function() {
		var isInReview = _state._isInReview;
		var isInAssessment = _state._isInAssessment;
		var isInitialised = _state._isInitialised;

		if ( (isInReview || isInAssessment) && isInitialised  ) Adapt.bottomnavigation.render();

	})

	.on("componentView:postRender", function(view) {
		//HIGHLIGHT CURRENT ASSOCIATED LEARNING COMPONENT
		if (_state._currentAssociatedLearningID == "" || !_state._isInReview) return;

    	var currentLearningId = _state._currentAssociatedLearningID;

    	var model = view.model;
    	var id = model.get("_id");

    	if (id == currentLearningId) $("."+id).addClass("component-highlight-border");

	})


	//ASSESSMENT
		//START ASSESSMENT
	.on("articleView:postRender", function(articleView) {

			if ( articleView.model.get("assessmentModel") && articleView.model.get('assessmentModel').get('_isEnabled') ) {

				//CAPTURE ASSESSMENT VIEW
				_state._views['assessment'] = articleView;

				_state._canAssessmentShowFeedback = articleView.model.get('_assessment')._canShowFeedback;

				//HACK FIX
				window.LABottomNavUpdater();

				var questionModel = articleView.model.get("assessmentModel").getQuestionModel();

				//POTENTIAL LOGIC BUG: WHAT HAPPENS WHEN REVISITING THE QUIZ AND THE QUIZ IS NOT RESET?
				
				//SETUP MODEL FROM ASSESSMENT
				learnerassistant.model.setup(questionModel);

				_state._isInReview = false;
				_state._isAssessmentComplete = false;
				_state._isInAssessment = true;

				if (_learnerassistant._certificateTitle.length > 0) {
					_learnerassistant._certificateTitleText = Adapt.course.get("title"); + " - " + _learnerassistant._certificateTitle
				} else {
					_learnerassistant._certificateTitleText = Adapt.course.get("title"); + _learnerassistant._certificateTitle
				}

				Adapt.trigger("learnerassistant:initialized");

				//SHOW APPROPRIATE NAV (PAGELEVELPROGRESS)
				learnerassistant.menu.bottomNavigation.assessmentProgress.show();

				articleView.setReadyStatus();
			}
		})

		//COMPLETE ASSESSMENT
	.on("assessment:complete", function(questionModel) {
			
			Adapt.trigger("learnerassistant:assessmentComplete", questionModel);

			_state._isAssessmentComplete = true;
			_state._isInAssessment = false;

			//UPDATE THE MODEL
			learnerassistant.model.update(questionModel);

			//RERENDER BOTTOM NAVIGATION (PAGELEVELPROGRESS)
			Adapt.bottomnavigation.render();

			//CHECK IF resultsOpen REQUIRED
			if ( _state._isAssessmentPassed ) Adapt.trigger("learnerassistant:assessmentPassed");
			else Adapt.trigger("learnerassistant:assessmentFailed");
		})

	.on("learnerassistant:assessmentPassed", function(questionModel) {

			//SHOW CERTIFICATE
			_state._isPanelResultsShown = false;
			_state._isPanelCertificateShown = true;

			_state._views['menu-topnavigation'].render();

			Adapt.trigger("learnerassistant:reviewOn");

			var _notify = _learnerassistant._beforeCertificate;

			_learnerassistant._certificateGraphics._rendered = undefined;

			if (!_notify._show) {

				Adapt.trigger("learnerassistant:certificateOpen");

			} else {
				
				var alertObject = {
				    title: _notify.title,
				    body: _notify.youScored + _state._assessmentScoreAsPercent + _notify.body,
				    confirmText: _notify.button,
				    _callbackEvent: "learnerassistant:certificateOpen",
				    _showIcon: false
				};

				Adapt.trigger('notify:alert', alertObject);
			}
		})

	.on("learnerassistant:assessmentFailed", function(questionModel) {

		//RESULTS REQUIRED
		_state._isPanelResultsShown = true;
		_state._isPanelCertificateShown = false;
		_state._views['menu-topnavigation'].render();

		Adapt.trigger("learnerassistant:reviewOn");

		var _notify = _learnerassistant._beforeRevision;

		if (!_notify._show) {

			Adapt.trigger("learnerassistant:resultsOpen");

		} else {
			
			var alertObject = {
			    title: _notify.title,
			    body: _notify.body,
			    confirmText: _notify.button,
			    _callbackEvent: "learnerassistant:resultsOpen",
			    _showIcon: false
			};

			Adapt.trigger('notify:alert', alertObject);
		}
		
	})


	//MAIN MENU REDIRECT
	.on('menuView:postRender', function(menuView) {
			
			var menuModelLASection = menuView.model.get("_learnerassistant");

			if ( menuModelLASection === undefined || menuModelLASection._redirectMenuOnPassed === false) return;

			//CANCEL IF ASSESSMENT VIEW IS NOT CAPTURED
			if ( _state._views['assessment'] === undefined ) return;

			//GET ASSESSMENT PAGE ID
			var pageId = _state._views['assessment'].model.get("_parentId");

			//CANCEL IF THIS MENU != ASSESSMENT MENU
			if ( pageId !== menuView.model.get("_id") ) return;

			var menuItemElement = menuView.$el;
			
			//REDIRECT CLICK EVENT TO CERTIFICATE
			menuItemElement.on("click", function(event) {

				//CANCEL IF IS NOT PASSED
				if (! _state._isAssessmentPassed ) return;
				
				//TURN OFF CLICK EVENTS ON MENU ITEM
				event.preventDefault();
				event.stopPropagation();
				Adapt.trigger("learnerassistant:certificateOpen");

			});

		})


	.on("router:plugin:la", function( pluginName, location, action ) {
		switch(location) {
		case "certificate":
			Adapt.trigger("learnerassistant:certificateOpen", true, false);
			break;
		case "results":
			Adapt.trigger("learnerassistant:resultsOpen", true, false);
			break;
		}
	})

	//LEARNERASSISTANT EVENTS - END POINTS
		//OPEN CERTIFICATE VIEW
	.on("learnerassistant:certificateOpen", function(internal, replace) {

			Adapt.trigger("learnerassistant:reviewOn");

			//MOVE BACK TO MAIN MENU
			//learnerassistant.navigateToMainMenu();
			//if (!internal) 
				learnerassistant.navigateToOther("certificate", replace);

			//SHOW THE RESULTS
			learnerassistant.panel.certificate.show();

			//RERENDER TOP NAVIGATION
			_state._views['menu-topnavigation'].render();

			learnerassistant.menu.bottomNavigation.associatedLearning.show();

		})

		//OPEN RESULTS VIEW
	.on("learnerassistant:resultsOpen", function(internal, replace) {
			
			Adapt.trigger("learnerassistant:reviewOn");

			//MOVE BACK TO MAIN MENU
			//learnerassistant.navigateToMainMenu();
			if (internal !== true) _skipNavigateAway = true;

			learnerassistant.navigateToOther("results", replace);

			//SHOW THE RESULTS
			learnerassistant.panel.results.show(function() {
				var resultsView = _state._views['panel-results'].$el.find(".la-content-container");
				html2img(  resultsView , function(data) {
					
					//add print button
					_state._resultsPrintImage = data;
					_state._isResultsPrintable = true;
					Adapt.bottomnavigation.render();

	        		/*var img = $("<img>").attr("src", data);
	        		resultsView.children().remove();
	        		resultsView.append(img);*/

				});
			});

			//RERENDER TOP NAVIGATION
			_state._views['menu-topnavigation'].render();

			//SHOW ASSIST LEARN NAV
			learnerassistant.menu.bottomNavigation.associatedLearning.show();

		})

	.on("learnerassistant:resultsClose", function(internal, replace) {

		//learnerassistant.panel.results.hide();
		_skipNavigateAway = true;
		learnerassistant.navigateToPrevious();

	})

		//OPEN QUIZ VIEW
	.on("learnerassistant:quizOpen", function() {

			learnerassistant.panel.results.hide(0);

			_state._isInReview = false;
			_state._isAssessmentComplete = false;
			_state._isAssessmentPassed = false;
			_state._isGuidedLearningMode = true;

			$("html").removeClass("guided-learning-mode");

			_state._views['menu-topnavigation'].$el.remove();

			var id = _state._views['assessment'].model.get("_id");

			learnerassistant.menu.topNavigation.hide();
			
			learnerassistant.navigateToId(id);

			learnerassistant.menu.bottomNavigation.assessmentProgress.show();

		})

	//LEARNERASSISTANT EVENTS - REVIEW MODE

		//REVIEWMODE VISUALS ON
	.on("learnerassistant:reviewOn", function() {

			_state._isGuidedLearningMode = true;

			$("html").addClass("guided-learning-mode");
			
			learnerassistant.menu.topNavigation.show();

		})

	.on("learnerassistant:reviewBegin", function() {

			var _notify = _learnerassistant._beginRevision;

			if (!_notify._show) {
				Adapt.trigger("learnerassistant:reviewNext");
				return;
			}

			var alertObject = {
			    title: _notify.title,
			    body: _notify.body,
			    confirmText: _notify.button,
			    _callbackEvent: "learnerassistant:reviewNext",
			    _showIcon: false
			};

			Adapt.trigger('notify:alert', alertObject);
		})

	.on("learnerassistant:reviewNext", function() {

			_state._isInReview = true;
			_state._isReviewInteractionComplete = false;

			var component = _.findWhere( _associatedlearning._path, { _interactions: 0 });

		
			if (_state._isReviewComplete || typeof component == "undefined") {
				//FINISHED

				var _notify = _learnerassistant._endRevision;

				if (!_notify._show) {

					Adapt.trigger("learnerassistant:quizOpen");
				} else {

					
					var alertObject = {
					    title: _notify.title,
					    body: _notify.body,
					    confirmText: _notify.button,
					    _callbackEvent: "learnerassistant:quizOpen",
					    _showIcon: false
					};

					Adapt.trigger('notify:alert', alertObject);

				}

			} else {

				//BEGIN REVISION & NEXT
				learnerassistant.navigateToId(component._id);

			}

		})

	.on("learnerassistant:reviewGotoItem", function(id) {

			_state._isInReview = true;
			
			var component = _.findWhere( _associatedlearning._path , { _id: id } );
			if ( component._isInteractionsComplete ) _state._isReviewInteractionComplete = true;
			else _state._isReviewInteractionComplete = false;

			var element = Adapt.findById(id);

			Adapt.trigger('drawer:closeDrawer');
			Adapt.learnerassistant.navigateToId(id);

		})

		//QUIT GUIDED LEARNING MODE
	.on("learnerassistant:reviewEnd", function(id) {
			
			var _notify = _learnerassistant._quitGuidedLearning;

			if (_state._isPanelCertificateShown) _notify = _learnerassistant._quitCertificate;

			if (!_notify._show) Adapt.trigger("learnerassistant:reviewOff");
			else {

				var promptObject = {
			    title: _notify.title,
			    body: _notify.body,
			    _prompts:[
				        {
				            promptText: _notify.buttons.yes,
				            _callbackEvent: "learnerassistant:reviewOff",
				        },
				        {
				            promptText:_notify.buttons.no,
				            _callbackEvent: ""
				        }
				    ],
				    _showIcon: true
				}

				Adapt.trigger('notify:prompt', promptObject);

			}
		})

		//CLICK ON HELP/TUTOR BUTTON
	.on("learnerassistant:tutorOpen", function(id) {
			
			var _notify = undefined;

			if (_state._isPanelResultsShown && ! _state._isInReview ) _notify = _learnerassistant._resultsTutorButton;
			if (_state._isPanelCertificateShown) _notify = _learnerassistant._certificateTutorButton;
			if (_state._isInAssessment) _notify = _learnerassistant._quizProgressTutorButton;

			if (_notify !== undefined) {
				if (! _notify._show) return;
				
				var alertObject = {
				    title: _notify.title,
				    body: _notify.body,
				    confirmText: _notify.button,
				    _callbackEvent: "",
				    _showIcon: false
				};

				Adapt.trigger('notify:alert', alertObject);

			} else {

				if (_state._isPanelResultsShown) Adapt.trigger("learnerassistant:resultsClose", false, false);//learnerassistant.panel.results.hide();
				else Adapt.trigger("learnerassistant:resultsOpen", false, false);//learnerassistant.panel.results.show();

			}

		})

		//COMPLETED CURRENT REVIEW COMPONENT
	.on("learnerassistant:reviewInteractionComplete", function(model) {
			
			//REMOVE HIGHLIGHT STYLE
			$("."+model.get("id")).removeClass("component-highlight-border");

			$("#la-next").removeClass("button-highlight-border").addClass("button-highlight-border");

			//RERENDER BOTTOM NAVIGATION
			Adapt.bottomnavigation.render();

			//RERENDER DRAWER
			if (typeof _state._views['drawer-assoclearn'].render == "function") _state._views['drawer-assoclearn'].render();

		})

		//COMPLETED REVIEW
	.on("learnerassistant:reviewComplete", function() {
			
		})
	
		//REVIEWMODE VISUALS OFF
	.on("learnerassistant:reviewOff", function() {

			_.delay(function() {

				learnerassistant.panel.results.hide();
				learnerassistant.panel.certificate.hide();
				learnerassistant.menu.bottomNavigation.associatedLearning.hide();
				learnerassistant.menu.topNavigation.hide();

				_state._isGuidedLearningMode = false;
				_state._isInReview = false;
				_state._isInAssessment = false;

				$("html").removeClass("guided-learning-mode");

				learnerassistant.navigateToMainMenu();

	        }, 300);

		})

	//NAVIGATE AWAY FROM REVIEW OR ASSESSMENT
	.on("learnerassistant:navigateAway", function() { 
			if (_skipNavigateAway) {
				_skipNavigateAway = false; 
				return;
			}

			if ( !_state._isInReview || _state._isInAssessment  ) {

				_state._isInAssessment = false;

				if ( _state._isMenuBottomAssessmentProgressShown ) learnerassistant.menu.bottomNavigation.assessmentProgress.hide();

				if (  _state._isPanelCertificateShown || _state._isPanelResultsShown  ) {
					Adapt.trigger("learnerassistant:reviewOff");
				}

			} else if ( _state._isInReview || !_state._isInAssessment ) {

				//RENDER AND STATUS UPDATE ON BOTTOM NAV WHEN NAVIGATE AWY FROM CURRENTASSOCIATEDLEARNINGID
				if (_state._currentAssociatedLearningID == "") return;
				if (_state._isPanelResultsShown) {
					learnerassistant.panel.results.hide();
					return;
				} else if (_state._isPanelCertificateShown) {
					learnerassistant.panel.certificate.hide();
					return;
				}

	        	var currentLearningId = _state._currentAssociatedLearningID;
	        	var top = $(window).scrollTop();

	            var $element = $("." + LAIfIdOffsetHiddenReturnParentId(currentLearningId));
	            if ($element.length === 0) return;

	            var element = Adapt.findById(currentLearningId);

	    		var elementTop = $element.offset().top - ($(window).height() /2);
	    		var elementHeight = $element.height();

	            if (elementTop < top + 1 && (elementTop + elementHeight) > top && !element.get("_isInteractionsComplete")) {
	                _state._isReviewInteractionComplete = false;
	            	Adapt.bottomnavigation.render();
	            } else {
	            	_state._isReviewInteractionComplete = true;
	            	Adapt.bottomnavigation.render();
	            }

			}
		})
	
	.on("learnerassistant:print", function() {
		if (_state._isPanelCertificateShown) {
			Adapt.trigger("learnerassistant:certificatePrint");
		} else if (_state._isPanelResultsShown) {
			Adapt.trigger("learnerassistant:resultsPrint");
		}
	})

	//CERTIFICATE PRINT WINDOW
	.on("learnerassistant:certificatePrint", function() {

			var _settings = JSON.parse(JSON.stringify(_learnerassistant._certificateGraphics));
			
			Adapt.trigger("printPreview:open", {
				instructions: _learnerassistant.printSaveInstructions,
				title: _settings._titleText.text,
				_rendered: _settings._rendered,
				postRender: function(settings) {

					var img = this.model.get("document").createElement("img");

					this.$el.html("").append(img);

					var thisHandle = this;

					$(img).load(function() {
						_.delay(function() {
							 thisHandle.setFocus();
						}, 0);
					});
					
					img.src = settings._rendered;
				}
			});
		})

	//RESULTS PRINT WINDOW
	.on("learnerassistant:resultsPrint", function() {
			Adapt.trigger("printPreview:open", {
				instructions: _learnerassistant.printSaveInstructions,
				title: "Results",
				_rendered: _state._resultsPrintImage,
				postRender: function(settings) {

					var img = this.model.get("document").createElement("img");

					this.$el.html("").append(img);

					var thisHandle = this;

					$(img).load(function() {
						_.delay(function() {
							 thisHandle.setFocus();
						}, 0);
					});
					
					img.src = settings._rendered;

				}
			});
		});
});