/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var menu = Backbone.View.extend(
		{
			//UI
			className: "la-assess-prog",
			template: "menu-bottomAssessmentProgress",

			//DRAWING
			preRender: function() {

				//COLLECT QUESTION COMPONENTS FROM ASSESSMENT AND PASS STATE TO TEMPLATE

				var _state = Adapt.learnerassistant.model.get("_state");
				var _learnerassistant = Adapt.learnerassistant.model.get('_learnerassistant');
				var _banks = Adapt.learnerassistant.model.get("_banks");
				var _associatedlearning = Adapt.learnerassistant.model.get('_associatedlearning');

				var assessmentView = _state._views['assessment'];
				var assessmentViewComponents = assessmentView.model.findDescendants('components');

		    	if (assessmentViewComponents.length === 0) return;
		    	
		    	//FILTER ITEMS THAT HAVE BEEN SPECIFICALLY TURNED ON/OFF OR ARE UNAVAILBLE
		    	var data = assessmentViewComponents.toJSON();
				data = _.filter(data, function(component) { 
					if (!component._isAvailable) return false;
					//CHECK IF USING PLP
					if (component._pageLevelProgress === undefined ||  component._pageLevelProgress._useAssessment === undefined || component._pageLevelProgress._useAssessment === false) return false;
					//CHECK IF DISABLED
					if (typeof component._learningassistentProgress == "undefined") return true;
					if (typeof component._learningassistentProgress._isEnabled == "undefined") return true;
					return component._learningassistentProgress._isEnabled;
				});

				this.model = {
					_state: _state,
					_learnerassistant: _learnerassistant,
					_banks: _banks,
					_associatedlearning: _associatedlearning,
		        	_questions: data
		        };

			},
			
			render: function() {

				this.preRender();

				var template = Handlebars.templates[this.template];

				this.$el.html(template(this.model));

			},

			//EVENTS
			events: {
				'click .la-tutor-button': 'onTutorButtonClick'
			},
			
			onTutorButtonClick: function(event) {
				event.preventDefault();

				Adapt.trigger("learnerassistant:tutorOpen");
			}

		}
	);

	return menu;
})
