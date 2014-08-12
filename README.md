adapt-assessment-learnerAssistant
=================================

Shows associated learning from assessment and navigates between flagged items

Requires: adapt-rollay, adapt-bottomnavigation, adapt-contrib-spoor, adapt-contrib-assessment

Included files: assets/certificate.html
Included files: assets/

LearnerAssistant Components:

	Model: Basic backbone model with two new functions, model.setup(questionModel) and model.update(questionModel)
	Model Private: Methods for creating model structures for guided learning banks, path and templates
	Public: Adapt.learnerassistant public interface
	Controller: Listens to events and runs appropriate behaviour
	Drawer: Showing guided learning review items
	Bottom Menu Assessment Progress: Showing assessment completion progress
	Bottom Menu Associated Learning: Showing guided learning navigation controls
	Top Menu: Showing title and tutor/help button
	Panel Certificate: Showing assessment certificate
	Panel Results: Showing assessment results and guided learning outcomes
	Print Window: Showing assessment certificate for printing

LearnerAssistant Dependencies:

	adapt-bottomnavigation: required for bottom navigation
	adapt-rollay: require for rollup overlay results and certificate panels
	adapt-contrib-assessment: required for assessmentModel.getQuestionModel(), assessment:complete and assessmentView:postRender
	adapt-contrib-spoor: required for fetching certificate username


LearnerAssistant Responds To Events:

```
	learnerassistant:certificateOpen
	learnerassistant:certificatePrint
	learnerassistant:navigateAway
	learnerassistant:quizOpen
	learnerassistant:resultsOpen
	learnerassistant:reviewBegin
	learnerassistant:reviewComplete
	learnerassistant:reviewEnd
	learnerassistant:reviewGotoItem (id)
	learnerassistant:reviewInteractionComplete
	learnerassistant:reviewNext
	learnerassistant:reviewOff
	learnerassistant:reviewOn
	learnerassistant:tutorOpen
```

LearnerAssistant Triggers Additional Events:
```
	learnerassistant:resultsOpened
	learnerassistant:resultsClosed
	learnerassistant:certificateOpened
	learnerassistant:certificateClosed
	learnerassistant:drawerOpened
```

Adapt.learnerassistant Public Interface:

```
	navigateToId(id)
	navigateToMainMenu()

	certificateRender(_settings, callback, ownerDocument)

	menu.topNavigation.show()
	menu.topNavigation.hide()

	menu.bottomNavigation.assessmentProgress.show()
	menu.bottomNavigation.assessmentProgress.hide()

	menu.bottomNavigation.associatedLearning.show()
	menu.bottomNavigation.associatedLearning.hide()

	panel.results.show()
	panel.results.hide()

	panel.certificate.show()
	panel.certificate.hide()

	drawer.show()
```

Adapt.learnerassistant.model: 

```
	"_associatedlearning": { //created at runtime from assessmentModel.getQuestionModel();
		"_banks": [
			{
				"_order": 0,
				"_questions": [],
				"_quizBankID": 1,
				"_title": "Bank Title",
				"_countTotalAssociatedLearning": 0,
				"_countReviewedAssociatedLearning": 0,
				"_countUnreviewedAssociatedLearning": 0,
				"_isReviewComplete": false
			}....
		],
		"_path": [

		],
		"_questions": [
			{
				"_associatedlearning": [
					{
						"_id": "c-",
						"title": "Component Title",
						"_interactions": 0,
						... all component data...
					}
				],
				"_id": "c-",
				"_quizBankID": 1,
				"title": "Question Title",
				"_isReviewComplete": false
			}....
		]
	},
	"_banks": [ //linked directly from course.json "_banks", specified by user
		{
			"title": "Bank Title"
		}....
	],
	"_learnerassistant": { //linked directly from course.json "_learnerassistant", specified by user
		"_beforeCertificate": {
			"_show": true,
			"body": "%",
			"button": "Show certificate",
			"title": "Congratulations!",
			"youScored": "You have passed the assessment with a score of "
		},
		"_beforeRevision": {
			"_show": true,
			"body": "You’ve completed the assessment, but you haven’t scored enough to pass just yet. Let’s see your score and what you need to revise.",
			"button": "See results",
			"title": "Almost there!"
		},
		"_beginRevision": {
			"_show": true,
			"body": "We’re about to take you on a guided learning journey through the course. Complete the components that appear in view, then select <b>Next</b> to move on to the next one. Alternatively, move through the components in the order you wish by choosing them from the progress bar. You can select the mortarboard icon to move back to the results panel at any point, or, if you want to stop revising, select <b>Quit revision mode</b>.",
			"button": "OK",
			"title": "Ready to revise?"
		},
		"_certificate": {
			"body": "%. Your certificate is below",
			"title": "Congratulations",
			"youScored": "You scored"
		},
		"_certificateButtons": {
			"_end": "Back to Menu",
			"_print": "Print"
		},
		"_certificateGraphics": {
			"_dateText": {
				"_left": "387.5",
				"_maxwidth": "300",
				"_top": "620"
			},
			"_imageURL": "assets/certificate.png",
			"_textColor": "#CF3239",
			"_textFont": "18pt sans-serif",
			"_titleText": {
				"_left": "387.5",
				"_maxwidth": "300",
				"_top": "458"
			},
			"_userText": {
				"_left": "387.5",
				"_maxwidth": "300",
				"_top": "550"
			}
		},
		"_certificateTitle": "Certificate",
		"_certificateTutorButton": {
			"_show": true,
			"body": "Click Back to Menu to go back to the menu or Print to print your certificate",
			"button": "OK",
			"title": "Revision mode"
		},
		"_drawerTitle": "Subjects for Revision",
		"_endRevision": {
			"_show": true,
			"body": "Now you’ve completed revision mode we’ll take you back to the randomised questions so you can retake the assessment.",
			"button": "Take assessment",
			"title": "Time to try again"
		},
		"_guidedLearningButtons": {
			"_continue": "Continue Revision",
			"_end": "Quit revision mode",
			"_finish": "Finish",
			"_next": "Next",
			"_start": "Launch revision mode"
		},
		"_guidedLearningTitle": "Revision Mode",
		"_menuBottomAssessmentProgress": {
			"_incrementalMarking": false,
			"_showInvisible": true,
			"_showProgress": true
		},
		"_quitCertificate": {
			"_show": true,
			"body": "Are you sure you would like to leave?",
			"buttons": {
				"no": "Stay",
				"yes": "Leave"
			},
			"title": "Leave Certificate"
		},
		"_quitGuidedLearning": {
			"_show": true,
			"body": "Are you sure you would like to leave?",
			"buttons": {
				"no": "Stay",
				"yes": "Leave"
			},
			"title": "Leave revision mode"
		},
		"_quizProgressTutorButton": {
			"_show": true,
			"body": "The circle icons at the bottom of the screen will fill as you progress through the assessment. Once you’ve completed all the questions you’ll receive feedback on how you did.",
			"button": "OK",
			"title": "Revision Mode"
		},
		"_results": {
			"_associateLearnings": "Subjects to revise",
			"_bank": "Subjects for revision",
			"_reviewed": "Reviewed",
			"_status": "Your status",
			"_toReview": "Flagged for review"
		},
		"_resultsTitle": "Results",
		"_resultsTutorButton": {
			"_show": true,
			"body": "Once you begin your revision, click on me again to see your progress",
			"button": "OK",
			"title": "Revision mode"
		},
		"_showAllFailedBankQuestions": false,
		"_sortResultsBanksBy": "mostInBank",
		"_revision": {
			"body": "%. Take a look at the revision plan we’ve drawn up for you below. It highlights the subjects that we recommend you review again so that you can have another go at the <b>Test your knowledge assessment</b>. To review the subjects, either select the <b>Launch revision mode</b> button at the bottom of the screen, or select the progress bar in the bottom right. Once you’ve reviewed a subject you’ll see that the flag icon in the revision plan will change to a book, showing that you’ve completed that subject.",
			"title": "Welcome to your results",
			"youScored": "You scored"
		}
	},
	"_state": { // created at runtime
		"_assessmentScore": 0, //derived from assessmentModel.getQuestionModel()
		"_assessmentScoreAsPercent": 0, //derived from assessmentModel.getQuestionModel()
		"_canAssessmentShowFeedback": false, //derived from article.json "_assessment._canShowFeedback"
		"_countBanksForReview": 0,
		"_countReviewedAssociatedLearning": 0,
		"_countTotalAssociatedLearning": 0,
		"_countUnreviewedAssociatedLearning": 0,
		"_currentAssociatedLearningID": "",
		"_isAssessmentComplete": false, //derived from assessmentModel.getQuestionModel()
		"_isAssessmentPassed": false, //derived from assessmentModel.getQuestionModel()
		"_isAssessmentPercentageBased": false, //derived from assessmentModel.getQuestionModel()
		"_isCertificateShown": false,
		"_isGuidedLearningMode": false, //IN RESULTS, CERTIFICATE OR REVIEW WITH TOP NAVIGATION
		"_isInAssessment": false,
		"_isInReview": false,
		"_isMenuBottomAssessmentProgressShown": false,
		"_isMenuBottomAssociatedLearningShown": false,
		"_isMenuBottomShown": false,
		"_isMenuTopShown": false,
		"_isPanelCertificateShown": false,
		"_isPanelResultsShown": false,
		"_isPanelShown": false,
		"_isReviewComplete": false,
		"_isReviewInteractionComplete": false,
		"_isReviewNeeded": false,
		"_menuBottom": "assessmentProgress",
		"_menuTop": "none",
		"_panel": "none",
		"_percentageReviewedAssociateLearning": 0,
		"_reviewInteractionEventsAttached": false,
		"_views": {
			"assessment": Backbone.View,
			"drawer-assoclearn": Backbone.View,
			"menu-bottomassessprog": Backbone.View,
			"menu-bottomassoclearn": Backbone.View,
			"menu-topnavigation": Backbone.View,
			"panel-certificate": Backbone.View,
			"panel-results": Backbone.View
		}
	}
```