/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var RollayView = require('extensions/adapt-rollay/js/rollayView');

	var LearnerassistantResultsView = RollayView.extend(
		{
			//UI
			className : "learnerassistant-resultsView",
			template : "learnerassistant-resultsView",
			postRender: function() {
				//update filter buttons
				this.$el.find(".learnerassistant-resultsView-filter a").removeClass("selected");
				this.$el.find(".learnerassistant-resultsView-filter a[data-filter='" + this.model.options.filter + "']").addClass("selected");
			}
		},
		{
			//INTERACTION
			events : {
				'click .learnerassistant-close': 'onCloseClick',
				'click a[data-filter]': 'onFilterClick',
				'click a[data-type="associatedlearning"]': 'onGotoElement'
			},
			onCloseClick: function(event) {
				event.preventDefault();
				Adapt.rollay.hide();
			},
			onFilterClick: function(event) {
				event.preventDefault();
				$currentTarget = $(event.currentTarget);
				
				this.options.filter = $currentTarget.attr("data-filter");
				this.options.selectedQuestions = this.options.questions[this.options.filter]
				
				this.reRender();
			},
			onGotoElement: function(event) {
				event.preventDefault();
				$currentTarget = $(event.currentTarget);
				var id = $currentTarget.attr("data-id");
				var element = Adapt.findByID(id)
				var typeNameConversion = {
					"component": "components",
					"article": "articles",
					"block": "blocks",
					"menu": "contentObject",
					"page": "contentObject"
				};
				Adapt.navigateToElement(id, typeNameConversion[element.get("_type")] );
				Adapt.rollay.hide();
			}
		},
		{
			//MODEL
			model: {
				data: null, /*{
					isPercentageBased: true/false,
	                isPass: true/false,
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
				options: null
			},
			options: {
				questions: {
					"all": null,
					"failed": null,
					"passed": null
				},
				associatedLearning: {},
				interactionEventsAttached: false,
				filter: "all"
			},
			modelInitialize: function(data) {
				this.clearInteractions();
				this.modelUpdate(data);
			},
			modelUpdate: function(data) {
				//pick out passed and failed questions and set default filter
				this.detachInteractionEvents();
				this.attachInteractionEvents(data);
				this.model.data = data;
				this.model.options = this.options;
				this.options.questions['all'] = _.values(data.allQuestions);
				this.options.questions['failed'] = _.filter(data.allQuestions, function(item) { return typeof item._isCorrect == "undefined" || item._isCorrect === false; });
				this.options.questions['passed'] = _.filter(data.allQuestions, function(item) { return typeof item._isCorrect !== "undefined" && item._isCorrect === true; });
				
				this.options.filter = "failed";
				this.options.selectedQuestions = this.options.questions[this.options.filter];
				
			}
		},
		{
			//INTERACTION EVENTS FOR ASSOCIATED LEARNING
			detachInteractionEvents: function() {
				var resultsViewHandle = this;
				if (this.options.interactionEventsAttached) {
					_.each(this.options.associatedLearning, function(assoc) {
						resultsViewHandle.stopListening( Adapt.findByID(assoc._id), "change:_isInteractionsComplete");
					});
					this.options.interactionEventsAttached = false;
				}
			},
			attachInteractionEvents: function(data) {
				var resultsViewHandle = this;
				if (!this.options.interactionEventsAttached) {
					_.each(data.allQuestions, function(question) {
						_.each(question._associatedLearning, function(assoc) {
							resultsViewHandle.options.associatedLearning[assoc._id] = assoc;
							if (typeof assoc._interactions == "undefined") assoc._interactions = 0;
						});
					});
					_.each(this.options.associatedLearning, function(assoc) {
						resultsViewHandle.listenTo( Adapt.findByID(assoc._id), "change:_isInteractionsComplete", resultsViewHandle.onInteraction);
					});
					this.options.interactionEventsAttached = true;
				}
			},
			//INTERACTION TRACKING
			clearInteractions: function() {
				this.options.associatedLearning = {};
				/*_.each(this.options.associatedLearning, function(assoc) {
					assoc._interactions = 0;
				});*/
			},
			onInteraction: function(model, isInteractionsComplete) {
				if (!isInteractionsComplete) return;

				this.options.associatedLearning[model.get('_id')]._interactions++;

				var resultsViewHandle = this;
				resultsViewHandle.options._isReviewComplete = true;
				_.each(this.options.questions['all'], function(question) {
					if(_.findWhere(question._associatedLearning, { _interactions:0 })) {
						question._isReviewComplete = false;
						resultsViewHandle.options._isReviewComplete = false;
					} else {
						question._isReviewComplete = true;
					}
				});
			}
		}
	);

	return LearnerassistantResultsView;
})