/*
* Assessment Page Level Progress
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>, Gavin McMaster <gavin.mcmaster@kineo.com>
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

				var assessmentView = _state._views['assessment'];
				var assessmentViewComponents = assessmentView.model.findDescendants('components');

				var c = new Backbone.Collection( assessmentViewComponents.filter(function(item) {
		    		return item.get('_isAvailable') && item.get('_pageLevelProgress') && item.get('_pageLevelProgress')._useAssessment;
		    	}) );

		    	if (c.length === 0) return;
		    	
		    	//FILTER ITEMS THAT HAVE BEEN SPECIFICALLY TURNED ON/OFF
		    	var data = c.toJSON();
				data = _.filter(data, function(item) { 
					if (typeof item._learningassistentProgress == "undefined") return true;
					if (typeof item._learningassistentProgress._isEnabled == "undefined") return true;
					return item._learningassistentProgress._isEnabled;
				});

				this.model = {
					_state: _state,
					_learnerassistant: _learnerassistant,
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

				Adapt.trigger("learnerassistant:reviewTutorOpen");
			}

		}
	);

	return menu;
})
