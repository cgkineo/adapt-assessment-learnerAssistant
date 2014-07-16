/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var orderBy = [ "co", "a", "b", "c" ];

	var LearnerassistantModel= Backbone.Model.extend(
		{
			defaults: {
				data: {}, /*{
					isPercentageBased: true/false,
	                isPass: true/false,
	                isReviewRequired: true/false,
	                countBanksToReview: 0+,
	                score: 0+,
	                scoreAsPercent: 0-100,
	                feedbackMessage: "",
	                associatedLearning: array(),
	                allQuestions: [
	                	{
							_isCorrect: true/false,
		                    title: "",
		                    _id: "",
		                    _associatedLearning: [
								{
									_id: assoc._id,
	                        		title: "",
	                        		_interactions: 0+
								}
		                    ],
		                    _isReviewComplete: true/false
		                }
	                ]
				}*/
				settings: {},
				banks: {},
				associatedLearning: [
				],
				options: {
					questions: {},
					banks: {},
					associatedLearning: {},
					interactionEventsAttached: false,
				},
				isComplete: false,
				isResultsShown: false
			},
			reset: function() {
				var model = $.extend(true, {}, JSON.parse(JSON.stringify(this.defaults)));
				model.associatedLearning = [];
				model.settings = Adapt.course.get("_learnerassistant");
				model.banks = Adapt.course.get("_banks");
				model.isComplete = false
				this.set(model);
			},
			setup: function(data) {
				this.clearInteractions();
				this.reset();
				this.update(data);
			},
			update: function(data) {
				var model = this.get("data");
				$.extend(true, model, JSON.parse(JSON.stringify(data)));
				this.set('data', model);

				var banks = this.get("banks");
				_.each(model.allBanks, function(item, _quizBankID) {
					_.extend(item, banks[item._quizBankID]);
					item.allQuestions = _.where(model.allQuestions, { _quizBankID: (typeof item._quizBankID == "number" ? parseInt(_quizBankID) : _quizBankID + "" ) });
				});

				//pick out passed and failed questions and set default filter
				this.detachInteractionEvents();
				this.attachInteractionEvents(model);
				var options = this.get('options');
				options.questions = _.values(model.allQuestions);

				var failedBanks = _.filter(model.allBanks, function(bank) { return _.filter(bank.allQuestions, function(item) { return typeof item._isCorrect == "undefined" || item._isCorrect === false; }).length > 0; });

				var settings = this.get("settings");
				options.banks = {};
				if (settings._showAllBankQuestions) {
					_.each(failedBanks, function(bank, index) {
						options.banks[bank._quizBankID] = { title: bank.title, questions: _.filter(bank.allQuestions, function(item) { return typeof item._isCorrect == "undefined" || item._isCorrect === false; }) };
					});
				} else {
					_.each(failedBanks, function(bank, index) {
						options.banks[bank._quizBankID] = { 
							title: bank.title, 
							questions: bank.allQuestions
						};
					});
				}

				this.set("countBanksForReview", failedBanks.length);
				this.set("isReviewNeeded", (options.countBanksForReview > 0));

				var assocLearn = null;
				//TODO: NEED TO REDO SORTS SO THAT ANY CHILD OBJECTS ARE REMOVED AS UNECESSARY
				switch (settings._showAssociatedLearningBy) {
				case "id":
					assocLearn = _.values(options.associatedLearning).sort(function(a, to) {
						//SORTED BY ELEMENT GRAVITY (PAGE, ARTICLE, BLOCK, COMPONENT) THEN BY ID A-Z
						var typea = orderBy.indexOf(a._id.substr(0, a._id.indexOf("-")));
						var typeto = orderBy.indexOf(to._id.substr(0, to._id.indexOf("-")));

						if (typea < typeto) return -1;
						if (typea > typeto) return 1;

						if (a._id < to._id) return -1;
						if (a._id > to._id) return 1;
						return 0;
					});
					break;
				case "bank":
				default:
					assocLearn = _.values(options.associatedLearning).sort(function(a, to) {
						//SORTED BY QUIZBANK 0-9, ELEMENT GRAVITY (PAGE, ARTICLE, BLOCK, COMPONENT) THEN BY ID A-Z
						if (a._quizBankID < to._quizBankID) return -1;
						if (a._quizBankID > to._quizBankID) return 1;

						var typea = orderBy.indexOf(a._id.substr(0, a._id.indexOf("-")));
						var typeto = orderBy.indexOf(to._id.substr(0, to._id.indexOf("-")));

						if (typea < typeto) return -1;
						if (typea > typeto) return 1;

						if (a._id < to._id) return -1;
						if (a._id > to._id) return 1;
						return 0;
					});
					break;
				}
				this.set("associatedLearning", assocLearn);

				this.calcReviewed();
			},
			//INTERACTION EVENTS FOR ASSOCIATED LEARNING
			detachInteractionEvents: function() {
				var resultsViewHandle = this;
				var options = this.get('options');
				if (options.interactionEventsAttached) {
					_.each(options.associatedLearning, function(assoc) {
						resultsViewHandle.stopListening( Adapt.findById(assoc._id), "change:_isInteractionsComplete");
					});
					options.interactionEventsAttached = false;
				}
			},
			attachInteractionEvents: function(data) {
				var resultsViewHandle = this;
				var options = this.get('options');
				if (!options.interactionEventsAttached) {
					_.each(data.allQuestions, function(question) {
						_.each(question._associatedLearning, function(assoc) {
							options.associatedLearning[assoc._id] = assoc;
							assoc._quizBankID = question._quizBankID;
							if (typeof assoc._interactions == "undefined") assoc._interactions = 0;
						});
					});
					_.each(options.associatedLearning, function(assoc) {
						resultsViewHandle.listenTo( Adapt.findById(assoc._id), "change:_isInteractionsComplete", resultsViewHandle.onInteraction);
					});
					options.interactionEventsAttached = true;
				}
				this.flagBugInteractionsCompletePropagation();
			},
			//INTERACTION TRACKING
			clearInteractions: function() {
				var options = this.get('options');
				options.associatedLearning = {};
			},
			onInteraction: function(model, isInteractionsComplete) {
				if (!isInteractionsComplete) return;
				var options = this.get('options');
				options.associatedLearning[model.get('_id')]._interactions++;
				this.flagBugInteractionsCompletePropagation();
				this.calcReviewed();
			},
			calcReviewed: function() {
				var resultsViewHandle = this;
				var options = this.get('options');
				options._isReviewComplete = true;
				_.each(options.questions, function(question) {
					if(_.findWhere(question._associatedLearning, { _interactions: 0 })) {
						question._isReviewComplete = false;
						options._isReviewComplete = false;
					} else {
						question._isReviewComplete = true;
					}
				});
				_.each(options.banks, function(bank) {
					bank._isReviewComplete = true;
					var associatedLearning = [].concat.apply([], _.pluck(bank.questions, "_associatedLearning"));
					bank._countTotalAssociatedLearning = associatedLearning.length;
					bank._countReviewedAssociatedLearning = _.filter(associatedLearning, function(item) { return item._interactions > 0 } ).length;
					bank._countUnreviewedAssociatedLearning = _.filter(associatedLearning, function(item) { return item._interactions == 0 } ).length;
					var notReviewedQuestions = _.findWhere(bank.questions, { _isReviewComplete: false });
					if(notReviewedQuestions) {
							bank._isReviewComplete = false;
					}
				});
				Adapt.trigger("learnerassistant:recalculated");
				if (options._isReviewComplete) {
					Adapt.trigger("learnerassistant:complete");
				}
			},
			flagBugInteractionsCompletePropagation: function() {
				var resultsViewHandle = this;
				var options = this.get('options');
				_.each(options.associatedLearning, function(assoc) {
					var element = Adapt.findById(assoc._id);
					element.getChildren().each(function(child) {
						if (child.get("_id").substr(0,2) == "co") {
							console.log("WARNING: Learning Assistant: Cannot track interactions with MENU items for associated learning entries. Page, article, block and component are OK, possibly add menu's pages as associated learning entries instead?");
						}
					});
				});
			}
		}
	);

	return LearnerassistantModel;
})