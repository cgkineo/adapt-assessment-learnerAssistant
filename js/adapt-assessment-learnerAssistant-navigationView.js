/*
* adapt-learnerassistant-resultsView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var BottomNavigationView = require('extensions/adapt-bottomnavigation/js/bottomnavigationView');

	var LearnerassistantNavigationView = BottomNavigationView.extend(
		{
			//UI
			className : "learnerassistant-navigationView navigation",
			template : "learnerassistant-navigationView",
			postRender: function() {
				var NavigationViewHandle = this;
				this.$el.find("#learnerassistant-toggle").addClass("open").removeClass("closed");
				Adapt.on("learnerassistant:resultsopened", function() {
					NavigationViewHandle.$el.find("#learnerassistant-toggle").addClass("open").removeClass("closed");
				});
				Adapt.on("learnerassistant:resultsclosed", function() {
					NavigationViewHandle.$el.find("#learnerassistant-toggle").removeClass("open").addClass("closed");
				});
				this.model.set("isInteractionsComplete", false);
			}
		},
		{
			//EVENTS
			events: {
				"click #learnerassistant-toggle" : "onResultsToggle",
				"click #learnerassistant-revision" : "onNextClick",
				"click #learnerassistant-next" : "onNextClick",
				"click #learnerassistant-takequiz" : "onNextClick",
				'click a[data-type="associatedlearning"]': 'onNextClick'
			},
			onResultsToggle: function(event) {
				if (!this.parent.model.get('isResultsShown')) this.parent.results.show();
				else this.parent.results.hide();
			},
			onNextClick: function(event) {

				var assoc = _.findWhere(this.model.get('associatedLearning'), { _interactions: 0 });

				event.preventDefault();
				$currentTarget = $(event.currentTarget);
				var element = Adapt.findById(assoc._id)
				var typeNameConversion = {
					"component": "components",
					"article": "articles",
					"block": "blocks",
					"menu": "contentObject",
					"page": "contentObject"
				};
				
				
				Adapt.navigateToElement(assoc._id, typeNameConversion[element.get("_type")] );
				this.parent.results.hide();
				this.render();
			}
		}
	);
	return LearnerassistantNavigationView;
})