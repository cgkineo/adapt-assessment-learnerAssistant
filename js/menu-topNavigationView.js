/*
 * adapt-contrib-pageLevelProgress
 * License - https://github.com/adaptlearning/adapt_framework/blob/master/LICENSE
 * Maintainers - Daryl Hedley <darylhedley@hotmail.com>, Himanshu Rajotia <himanshu.rajotia@credipoint.com>
 */
define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var ProgressDrawerView = Backbone.View.extend(
		{
			//UI
			tagName: "div",
			className: "la-tutor-icon",
			template: "menu-topNavigation",
			initialize: function() {
				this.listenTo(Adapt, 'remove', this.remove);
			},
			preRender: function() {
				this.model = Adapt.learnerassistant.model;
			},
			render: function() {
				this.preRender();
				var template = Handlebars.templates[this.template];
				this.$el.html(template(this.model.toJSON()));
				_.defer(_.bind(function() {
					this.postRender();
				}, this));
			},
			postRender: function() {
				this.$el.attr("href","#");
				this.undelegateEvents();
				this.delegateEvents();
			},
		
			//EVENTS
			events: {
				'click .title-bar': 'onIconClick',
				'click .close': 'onEndClick'
			},
			onEndClick: function() {
				var settings = this.model.get("settings");
				if (Adapt.learnerassistant.model.get("isCertificateShown")) {
					if (!settings._quitGuidedLearning._show) {

						Adapt.trigger("learnerassistant:gracefullQuit");

					} else {

						var promptObject = {
					    title: settings._quitCertificate.title,
					    body: settings._quitCertificate.body,
					    _prompts:[
						        {
						            promptText: settings._quitCertificate.buttons.yes,
						            _callbackEvent: "learnerassistant:gracefullQuit",
						        },
						        {
						            promptText: settings._quitCertificate.buttons.no,
						            _callbackEvent: ""
						        }
						    ],
						    _showIcon: true
						}

						Adapt.trigger('notify:prompt', promptObject);
					}
				} else {
					if (!settings._quitGuidedLearning._show) {

						Adapt.trigger("learnerassistant:gracefullQuit");

					} else {

						var promptObject = {
					    title: settings._quitGuidedLearning.title,
					    body: settings._quitGuidedLearning.body,
					    _prompts:[
						        {
						            promptText: settings._quitGuidedLearning.buttons.yes,
						            _callbackEvent: "learnerassistant:gracefullQuit",
						        },
						        {
						            promptText: settings._quitGuidedLearning.buttons.no,
						            _callbackEvent: ""
						        }
						    ],
						    _showIcon: true
						}

						Adapt.trigger('notify:prompt', promptObject);
					}
				}
			},
			onIconClick: function(event) {
				event.preventDefault();
				if (Adapt.learnerassistant.model.get("isCertificateShown")) {
					var settings = Adapt.learnerassistant.model.get("settings");
					if (! settings._certificateTutorButton._show) return;
					
					var alertObject = {
					    title: settings._certificateTutorButton.title,
					    body: settings._certificateTutorButton.body,
					    confirmText: settings._certificateTutorButton.button,
					    _showIcon: false
					};

					Adapt.trigger('notify:alert', alertObject);
				} else if (!Adapt.learnerassistant.model.get("isInReview")) {
					//FINISHED
					var settings = Adapt.learnerassistant.model.get("settings");
					if (! settings._resultsTutorButton._show) return;
					
					var alertObject = {
					    title: settings._resultsTutorButton.title,
					    body: settings._resultsTutorButton.body,
					    confirmText: settings._resultsTutorButton.button,
					    _showIcon: false
					};

					Adapt.trigger('notify:alert', alertObject);
				} else {
					if (Adapt.learnerassistant.model.get("isResultsShown")) Adapt.learnerassistant.panel.results.hide();
					else Adapt.learnerassistant.panel.results.show();
				}
			}
			
		}
	);
	return ProgressDrawerView;
})