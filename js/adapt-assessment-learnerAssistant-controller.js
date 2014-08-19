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


	//NAVIGATE AWAY GLOBAL TRIGGERS
		//SCROLL AWAY
	$(window).on("scroll", function() {

			var isInReview = _state._isInReview;
			var isInitialised = _state._isInitialised;
			
			if ( isInReview  && isInitialised ) Adapt.trigger("learnerassistant:navigateAway");

		});

		//BACK BUTTON CLICKED OR CHANGE TO MENU SCREEN
	Adapt.on("navigation:backButton router:menu",  function () { 

			var isInReview = _state._isInReview;
			var isInAssessment = _state._isInAssessment;
			var isInitialised = _state._isInitialised;

			if ( (isInReview || isInAssessment) && isInitialised  ) Adapt.trigger("learnerassistant:navigateAway");

		})

		//CHANGE TO ANOTHER PAGE
	.on("router:page", function(model) {

			var isAssessmentPage = model.get("_assessment") !== undefined;
			var isInitialised = _state._isInitialised;

			if ( isAssessmentPage && isInitialised ) Adapt.trigger("learnerassistant:navigateAway");

		})

		//ROLLAY HIDE
	.on("rollay:closed", function() {

			learnerassistant.panel.results.hide();
			learnerassistant.panel.certificate.hide();

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
			
			//FIRED ON ASSESSMENT COMPLETE
			_state._isAssessmentComplete = true;
			_state._isInAssessment = false;
			
			//UPDATE THE MODEL
			learnerassistant.model.update(questionModel);

			//RERENDER BOTTOM NAVIGATION (PAGELEVELPROGRESS)
			Adapt.bottomnavigation.render();

			//CHECK IF resultsOpen REQUIRED
			if ( _state._isAssessmentPassed ) {
				//SHOW CERTIFICATE

				_state._isPanelResultsShown = false;
				_state._isPanelCertificateShown = true;

				_state._views['menu-topnavigation'].render();

				Adapt.trigger("learnerassistant:reviewOn");

				var _notify = _learnerassistant._beforeCertificate;

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
				return;
			}

			//RESULTS REQUIRED
			_state._isPanelResultsShown = true;
			_state._isCertificateShown = false;
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

			//CANCEL IF IS NOT PASSED
			if (! _state._isAssessmentPassed ) return;

			var menuItemElement = menuView.$el;

			//TURN OFF CLICK EVENTS ON MENU ITEM
			menuItemElement.off("click");

			//REDIRECT CLICK EVENT TO CERTIFICATE
			menuItemElement.on("click", function(event) {

				event.preventDefault();
				Adapt.trigger("learnerassistant:certificateOpen");

			});

		})


	//LEARNERASSISTANT EVENTS - END POINTS
		//OPEN CERTIFICATE VIEW
	.on("learnerassistant:certificateOpen", function() {

			Adapt.trigger("learnerassistant:reviewOn");

			//MOVE BACK TO MAIN MENU
			learnerassistant.navigateToMainMenu();

			//SHOW THE RESULTS
			learnerassistant.panel.certificate.show();

			//RERENDER TOP NAVIGATION
			_state._views['menu-topnavigation'].render();

			learnerassistant.menu.bottomNavigation.associatedLearning.show();

		})

		//OPEN RESULTS VIEW
	.on("learnerassistant:resultsOpen", function() {
			
			Adapt.trigger("learnerassistant:reviewOn");

			//MOVE BACK TO MAIN MENU
			learnerassistant.navigateToMainMenu();

			//SHOW THE RESULTS
			learnerassistant.panel.results.show();

			//RERENDER TOP NAVIGATION
			_state._views['menu-topnavigation'].render();

			//SHOW ASSIST LEARN NAV
			learnerassistant.menu.bottomNavigation.associatedLearning.show();

		})

		//OPEN QUIZ VIEW
	.on("learnerassistant:quizOpen", function() {

			//learnerassistant.panel.results.hide();

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
				    _showIcon: false
				};

				Adapt.trigger('notify:alert', alertObject);

			} else {

				if (_state._isPanelResultsShown) learnerassistant.panel.results.hide();
				else learnerassistant.panel.results.show();

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

			if ( !_state._isInReview || _state._isInAssessment ) {

				_state._isInAssessment = false;

				if ( !_state._isGuidedLearningMode ) learnerassistant.menu.bottomNavigation.assessmentProgress.hide();

			} else if ( _state._isInReview || !_state._isInAssessment ) {

				//RENDER AND STATUS UPDATE ON BOTTOM NAV WHEN NAVIGATE AWY FROM CURRENTASSOCIATEDLEARNINGID
				if (_state._currentAssociatedLearningID == "") return;

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
	
	//CERTIFICATE PRINT WINDOW
	.on("learnerassistant:certificatePrint", function() {

			var _settings = JSON.parse(JSON.stringify(_learnerassistant._certificateGraphics));

			var nwindow =  window.open("assets/certificate.html", "Certificate");
			
			var loaded = false;

			//READY EVENT FOR NEW WINDOW
			$(nwindow).bind("load", function() {
				if (!loaded) render();
				loaded = true;
			});

			var impatience = setTimeout(function() {
				if (!loaded) render();
				loaded = true;
			}, 500); // document should have loaded after a second

			function render() {
				clearTimeout(impatience);

				$("html", nwindow.document).addClass( $("html", window.document).attr("class") );

				if (_settings._rendered === undefined) {
					//INVOLKED VIA CONSOLE - TESTING ONLY
					if (_settings._imageURL.substr(0,7) == "assets/") _settings._imageURL = _settings._imageURL.substr(7);
					_settings._titleText.text = Adapt.course.get("title");
					_settings._userText.text = require("extensions/adapt-contrib-spoor/js/scormWrapper").instance.getStudentName();
					if (_settings._userText.text === undefined) _settings._userText.text = "Unknown User";

					learnerassistant.certificateRender(_settings, complete, nwindow.document);
				} else complete(_settings._rendered);
			}

			function complete(imgUrl) {
				var prevTitle = $("title", nwindow.document).html();

				$("title", nwindow.document).html( "Loading..." );

				var img = nwindow.document.createElement("img");
				$("#image-container", nwindow.document).html("").append(img);

				$(img).load(function() {
					console.log("Certificate Print: Image loaded");
					$("title", nwindow.document).html(_settings._titleText.text + " - " + prevTitle);
					_.delay(function() {
						console.log("Certificate Print: Print Preview");
						nwindow.focus();
						nwindow.print();
						nwindow.close();
					}, 0);
				});
				
				img.src = imgUrl;

			}
			
		});

});