/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var LearnerassistantResultsView = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-resultsView');
	
	//GLOBAL LEARNERASSISTANT CONTEXT
	var LearnerAssistant = {
		model: null, //will be a copy of the assessment questionModel
		views: {},
		modelInitialize: function(questionModel) {
			//Copy questionModel to extend it
			LearnerAssistant.model = JSON.parse(JSON.stringify(questionModel));

			//extend questionModel copy by adding default learnerassistent properties
			var defaults = {
				_revisited : false
			}
			for (var i = 0; i < LearnerAssistant.model.allQuestions.length; i++) _.extend(LearnerAssistant.model.allQuestions[i], defaults);

			//Update results view
			this.views['results'].modelInitialize(LearnerAssistant.model);
		},
		modelUpdate: function(questionModel) {
			//Update questionModel copy
			$.extend(true, LearnerAssistant.model, JSON.parse(JSON.stringify(questionModel)));

			//Update results view
			this.views['results'].modelUpdate(LearnerAssistant.model);
		},
		resultsShow: function() {
			//Change rollay view to results view
			Adapt.rollay.setCustomView( this.views['results'] );

			//Reshow the rollay
			Adapt.rollay.hide(0);
			Adapt.rollay.show();
		}
	};


	//VIEW INSTANCIATION
	LearnerAssistant.views['results'] = new LearnerassistantResultsView();

	//GLOBAL EVENT LISTENERS
	Adapt.on("articleView:postRender", function(view) {
		if (view.model.get("assessmentModel")) {
			var questionModel = view.model.get("assessmentModel").getQuestionModel();
			LearnerAssistant.modelInitialize.call(LearnerAssistant, questionModel);
		}
	});

	Adapt.on("assessment:complete", function(questionModel) {
		//fired on assessment complete
		LearnerAssistant.modelUpdate.call(LearnerAssistant, questionModel);
		LearnerAssistant.resultsShow();
	});

	Adapt.once('app:dataReady', function() {
		
	});


	return LearnerAssistant;
});