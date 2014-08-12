/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var priv = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-model-private');

	var model = Backbone.Model.extend(
		{
			defaults: {
				_learnerassistant: {},
				_banks: {},
				_associatedlearning: {
					_banks: [],
					_questions: [],
					_path: []
				},
				_state: {
					_assessmentScore: 0,
					_assessmentScoreAsPercent: 0,
					_canAssessmentShowFeedback: false,
					_countBanksForReview: 0,
					_countReviewedAssociatedLearning: 0,
					_countTotalAssociatedLearning: 0,
					_countUnreviewedAssociatedLearning: 0,
					_currentAssociatedLearningID: "",
					_isAssessmentComplete: false,
					_isAssessmentPassed: false,
					_isAssessmentPercentageBased: false,
					_isCertificateShown: false,
					_isGuidedLearningMode: false,
					_isInAssessment: false,
					_isInReview: false,
					_isMenuBottomAssessmentProgressShown: false,
					_isMenuBottomAssociatedLearningShown: false,
					_isMenuBottomShown: false,
					_isMenuTopShown: false,
					_isPanelCertificateShown: false,
					_isPanelResultsShown: false,
					_isPanelShown: false,
					_isReviewComplete: false,
					_isReviewInteractionComplete: false,
					_isReviewNeeded: false,
					_menuBottom: "none",
					_menuTop: "none",
					_panel: "none",
					_percentageReviewedAssociateLearning: 0,
					_reviewInteractionEventsAttached: false,
					_views: {}
				}
			},

			setup: function(questionModel) {

				var _associatedlearning = this.get("_associatedlearning");
				var _state = this.get("_state");

				_associatedlearning._questions.length = 0;
				_associatedlearning._banks.length = 0;
				_associatedlearning._path.length = 0;

				_state._currentAssociatedLearningID = "";
				_state._countBanksForReview = 0;
				_state._countTotalAssociatedLearning = 0;
				_state._countReviewedAssociatedLearning = 0;
				_state._countUnreviewedAssociatedLearning = 0;
				_state._percentageReviewedAssociateLearning = 0;
				_state._isAssessmentPassed = false;
				_state._assessmentScore = 0;
				_state._assessmentScoreAsPercent = 0;
				_state._isReviewInteractionComplete = false;
				_state._isReviewComplete = false;
				_state._isReviewNeeded = false;

				$.extend(this.get("_learnerassistant"), Adapt.course.get("_learnerassistant"));
				$.extend(this.get("_banks"), Adapt.course.get("_banks"));

				this.update(questionModel);

			},

			update: function(questionModel) {

				var _state = this.get("_state");
				var _banks = this.get("_banks");
				var _associatedlearning = this.get('_associatedlearning');
				var _learnerassistant = this.get("_learnerassistant");

				//CLONE QUESTION MODEL
				questionModel =  JSON.parse(JSON.stringify(questionModel));

				//RELINK allBanks and allQuestions after CLONE ^
				_.each(questionModel.allBanks, function(bank, _quizBankID) {

					_.extend(bank, _banks[bank._quizBankID]);

					var selectQuestionsWhereQuizBankID = typeof bank._quizBankID == "number" ? parseInt(_quizBankID) : _quizBankID + "";

					bank.allQuestions = _.where(questionModel.allQuestions, { 
						_quizBankID: selectQuestionsWhereQuizBankID 
					});

				});
				
				//UPDATE ASSESSMENT STATE
				_state._isAssessmentPassed = questionModel.isPass;
				_state._isAssessmentPercentageBased = questionModel.isPercentageBased;
				_state._assessmentScore = questionModel.score;
				_state._assessmentScoreAsPercent = questionModel.scoreAsPercent;

				priv.phase1.call(this, questionModel);
				
				//CANCEL IF ASSESSMENT IS NOT COMPLETE
				_state._isInitialised = true;
				
				if (!_state._isAssessmentComplete) return;

				priv.phase2.call(this);
				
			}
		}		
	);

	return model;
})