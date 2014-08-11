/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');

	var priv = {

		phase1: function(questionModel) {

			//REMOVE REVIEW COMPONENT INTERACTION EVENTS
			priv.detachReviewPathInteractionEvents.call(this);

			//PICK OUT QUESTIONS
			priv.pickQuestionsAndBanks.call(this, questionModel);

		},

		phase2: function() {

			priv.expandQuestionsAssociatedLearning.call(this); //CO + A + B > C

			priv.populateReviewPath.call(this);

			priv.sortReviewPath.call(this);;

			priv.attachReviewPathInteractionEvents.call(this);;

			priv.calculateReviewed.call(this);

		},

		detachReviewPathInteractionEvents: function() {

			var modelHandle = this;
			var _associatedlearning = this.get('_associatedlearning');
			var _state = this.get('_state');

			if ( _state._reviewInteractionEventsAttached ) {

				_.each(_associatedlearning._path, function(component) {

					//BUG: SOMETIME DOES NOT FIRE, FIXISH IN _hacks.js
					modelHandle.stopListening( Adapt.findById(component._id), "change:_isInteractionsComplete");

				});

				_state._reviewInteractionEventsAttached = false;
			}

		},

		pickQuestionsAndBanks: function(questionModel) {

			var _state = this.get("_state");
			var _banks = this.get("_banks");
			var _associatedlearning = this.get('_associatedlearning');
			var _learnerassistant = this.get("_learnerassistant");

			//PICK OUT PASSED AND FAILED QUESTION BANKS
			var failedBanks = _.filter(questionModel.allBanks, function(bank) { 
				return _.filter(bank.allQuestions, function(question) { 
					var isQuestionIncorrect = typeof question._isCorrect == "undefined" || question._isCorrect === false;
					return isQuestionIncorrect; 
				}).length > 0; //INCLUDE BANKS WITH ONE OR MORE FAILED QUESTIONS
			});

			//BUILD ASSOCIATED LEARNING BANK AND QUESTION LISTS
			_associatedlearning._banks = [];
			if ( !_learnerassistant._showAllFailedBankQuestions ) {
				//ONLY SELECT FAILED QUESTIONS

				//BUILD BANKS FOR ASSOCIATED LEARNING
				_.each(failedBanks, function(bank) {
					_associatedlearning._banks.push(
						{ 
							title: bank.title, 
							_questions: _.filter(bank.allQuestions, function(question) { 
								var isQuestionIncorrect = typeof question._isCorrect == "undefined" || question._isCorrect === false;
								return isQuestionIncorrect; 
							}),
							_quizBankID: bank._quizBankID,
							_order: failedBanks.length
						}
					);
				});

				//BUILD QUESTIONS FOR ASSOCIATED LEARNING
				_associatedlearning._questions = _.filter(questionModel.allQuestions, function(question) { 
					var isQuestionIncorrect = typeof question._isCorrect == "undefined" || question._isCorrect === false;
					return isQuestionIncorrect; 	
				});

			} else {
				//SELECT ALL QUESTIONS FROM FAILED BANKS

				_associatedlearning._questions = [];
				
				//BUILD BANKS FOR ASSOCIATED LEARNING
				_.each(failedBanks, function(bank) {
					_associatedlearning._banks.push(
						{ 
							title: bank.title, 
							_questions: bank.allQuestions,
							_quizBankID: bank._quizBankID,
							_order: failedBanks.length
						}
					);

					//BUILD QUESTIONS FOR ASSOCIATED LEARNING
					_associatedlearning._questions = _associatedlearning._questions.concat(bank.allQuestions);
				});

			}

			//UPDATE STATE
			_state._countBanksForReview = failedBanks.length;
			_state._isReviewNeeded = (failedBanks.length > 0);

		},
		
		expandQuestionsAssociatedLearning: function () {

			var _associatedlearning = this.get('_associatedlearning');

			//GO THROUGH EACH QUESTION
			_.each(_associatedlearning._questions, function(question) {

				var finishAssocLearning = [];

				//GO THROUGH EACH ASSOCIATED LEARNING ON THE QUESTION
				_.each(question._associatedLearning, function (component) {

					var type = component._id.substr(0, component._id.indexOf("-"));
					if (type == "c") {

						//IF ASSOC LEARNING IS COMPONENT, ADD STRAIGHT TO LIST
						var parent = Adapt.findById(Adapt.findById(component._id).get("_parentId"));
						finishAssocLearning.push(component);

					} else {
						
						//ELSE FIND ASSOC LEARNING DESCENDANT COMPONENT 
						var model = Adapt.findById(component._id );
						var descendents = model.findDescendants("components");
						
						if (descendents.filter(function(item) { 

								//CHECK IF AVAILABLE
								if (typeof item.get("_isAvailable") === false) return false; 

								//CHECK IF NOT DISABLED
								if (typeof item.get("_learningassistentProgress ") != "undefined" && item.get("_learningassistentProgress ")._isEnabled === false) return false;

								return true;

							} ).length === 0) return false; //SKIP IF NO COMPATIBLE DESCENDANTS FOUND

						descendents = descendents.toJSON();
						//ADD TO LIST
						finishAssocLearning = finishAssocLearning.concat(descendents);
					}

				});

				//GET UNIQUE LIST OF ASSOCIATED LEARNING FOR THE QUESTION
				question._associatedLearning = _.uniq(finishAssocLearning, function(component) {  
					return component._id;
				});

			});

		},

		populateReviewPath: function () {

			var _associatedlearning = this.get('_associatedlearning');

			//COLLECT UNIQUE ASSOCIATED LEARNINGS FROM ALL QUESTIONS
			var _path = {};
			_.each(_associatedlearning._questions, function(question) {
				_.each(question._associatedLearning, function(component, index) {

					if (_path[component._id] !== undefined) {

						//IF QUESTIONS HAVE PREEXISTING ITEM, MAKE SURE REFERENCE IS THE SAME FOR INTERACTION UPDATES
						question._associatedLearning[index] = _path[component._id];

					} else {

						//ADD ITEM TO LIST
						_path[component._id] = component;

					}
					component._quizBankID = question._quizBankID;

					if (typeof component._interactions == "undefined") component._interactions = 0;

				});
			});

			//BUILD ASSOCIATED LEARNING PATH ARRAY
			_associatedlearning._path = _.values( _path );

		},
		
		attachReviewPathInteractionEvents: function() {

			var modelHandle = this;

			var _associatedlearning = this.get('_associatedlearning');
			var _state = this.get('_state');

			if (!_state._reviewInteractionEventsAttached) {

				_.each(_associatedlearning._path, function(component) {

					//BUG: SOMETIME DOES NOT FIRE, FIXISH IN _hacks.js
					modelHandle.listenTo( Adapt.findById(component._id), "change:_isInteractionsComplete", function (model, isInteractionsComplete) {
						priv.onInteraction.call(modelHandle, model, isInteractionsComplete); 
					});

				});

				_state._reviewInteractionEventsAttached = true;
			}

		},


		onInteraction: function(model, isInteractionsComplete) {

			//CANCEL IF INTERACTION NOT COMPLETE (HAPPENS ON COMPONENT RESET)
			if (!isInteractionsComplete) return;

			var _path = this.get('_associatedlearning')._path;

			var pathItem = _.findWhere( _path, { "_id": model.get('_id') } );

			//CANCEL IF INTERACTION HAPPENED ON OBJECT NOT IN PATH LIST
			if ( pathItem === undefined) return;

			//INCREMENT INTERACTIONS
			pathItem._interactions++;

			//UPDATE PATH ITEM WITH CURRENT MODEL STATE
			$.extend(pathItem, model.toJSON());

			//RECALCULATE COMPLETE INTERACTIONS
			priv.calculateReviewed.call(this);
			
			//UPDATE STATE
			var _state = this.get("_state");
			if (model.get("_id") == _state._currentAssociatedLearningID) {
				_state._isReviewInteractionComplete = true;
			}

			//TRIGGER EVENTS
			Adapt.trigger("learnerassistant:reviewInteractionComplete", model);
			if (_state._isReviewComplete) {
				Adapt.trigger("learnerassistant:reviewComplete");
			}

		},

		sortReviewPath: function() {
			var _learnerassistant = this.get("_learnerassistant");
			var _associatedlearning = this.get('_associatedlearning');

			var _path = _associatedlearning._path;
			var _banks = _associatedlearning._banks;

			_path.sort(function(a, to) {
				//SORTED PATH BY ID A-Z
				if (a._id < to._id) return -1;
				if (a._id > to._id) return 1;
				return 0;
			});

			if (_learnerassistant._sortResultsBanksBy!== undefined) {

				//SORT BANKS BY
				switch (_learnerassistant._sortResultsBanksBy) {
				case "mostInBank":
					var mostInBank = _.countBy(_path, function(component) { 
						return component._quizBankID; 
					}); 

					//POSSIBLE BUG / DEFINITE LOGIC ERROR:
					// each question only has one bank id but can exist in more than one bank which gives unfair representation to some banks and so effects sort order

					var newBankOrder = {};
					var order = 0;
					_.each(_banks, function(bank) {
						bank._order = mostInBank[bank._quizBankID];
					});
					_.each(_path, function(assoc) {
						if (typeof newBankOrder["b" + assoc._quizBankID] == "undefined") {
							newBankOrder["b"+assoc._quizBankID] = true;
							bank = _.findWhere(_banks, { _quizBankID: assoc._quizBankID});
							bank._order = order;
							order++;
						}
					});

					_banks.sort(function(a,b) {
						return b._order-a._order;
					});
					break
				}
			}					

		},

		calculateReviewed: function() {

			var resultsViewHandle = this;
			var _state = this.get('_state');
			var _associatedlearning = this.get('_associatedlearning');
			_state._isReviewComplete = true;
			_state._countTotalAssociatedLearning = 0;
			_state._countReviewedAssociatedLearning = 0;
			_state._countUnreviewedAssociatedLearning = 0;
			_.each(_associatedlearning._questions, function(question) {
				if(_.findWhere(question._associatedLearning, { _interactions: 0 })) {
					question._isReviewComplete = false;
					_state._isReviewComplete = false;
				} else {
					question._isReviewComplete = true;
				}
			});

			_.each(_associatedlearning._banks, function(bank) {
				var associatedLearning = _.uniq([].concat.apply([], _.pluck(bank._questions, "_associatedLearning")), function(item) { return item._id; });
				bank._countTotalAssociatedLearning = associatedLearning.length;
				_state._countTotalAssociatedLearning+=bank._countTotalAssociatedLearning;
				bank._countReviewedAssociatedLearning = _.filter(associatedLearning, function(item) { return item._interactions > 0 } ).length;
				_state._countReviewedAssociatedLearning+=bank._countReviewedAssociatedLearning;
				bank._countUnreviewedAssociatedLearning = _.filter(associatedLearning, function(item) { return item._interactions == 0 } ).length;
				_state._countUnreviewedAssociatedLearning+=bank._countUnreviewedAssociatedLearning;
				var notReviewedQuestions = _.findWhere(bank._questions, { _isReviewComplete: false });
				if(notReviewedQuestions) {
					bank._isReviewComplete = false;
				} else {
					bank._isReviewComplete = true;
				}
			});

			_state._percentageReviewedAssociateLearning = (100/ _state._countTotalAssociatedLearning) * _state._countReviewedAssociatedLearning;

		}
	};

	return priv;
});
