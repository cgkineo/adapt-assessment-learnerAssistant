define(function(require) {

    var Adapt = require('coreJS/adapt');

//GOTO REVEAL PARENT IF REVEAL HIDDEN
	function LAIfIdOffsetHiddenReturnParentId(id) {
        if (LAIfIdOffsetHiddenReturnParentId.swapOutIds[id] !== undefined) return LAIfIdOffsetHiddenReturnParentId.swapOutIds[id];

        var $element = $("." + id);
        var displayNoneParents = _.filter($element.parents(), function(item) { return $(item).css("display") == "none"; } );
        if (displayNoneParents.length === 0) return id;

        var parentId = Adapt.findById(id).get("_parentId");
        LAIfIdOffsetHiddenReturnParentId.swapOutIds[id] = parentId;
        return parentId;
    }
    LAIfIdOffsetHiddenReturnParentId.swapOutIds = {};
    window.LAIfIdOffsetHiddenReturnParentId = LAIfIdOffsetHiddenReturnParentId;

    

//UPDATE BOTTOM NAV WITH ASSESSMENT INTERACTIONS
   /* window.LABottomNavUpdater = function() {
       

        //BACKBONE SOMETIMES DOESN'T FIRED QUEUED CHANGE EVENTS ON MODELS
        // change:_isInteractionsComplete accasionally doesn't fire

        var _state = Adapt.learnerassistant.model.get("_state");

        Adapt.once("componentView:postRender", function(componentView) {

            var blockId = componentView.model.get("_parentId");
            var articleId = Adapt.findById(blockId).get("_parentId");
            var article = Adapt.findById(articleId);

            if ( article.get("assessmentModel") && article.get('assessmentModel').get('_isEnabled') ) {

                componentView.$el.find(".buttons-action").one("click", function() {

                    if ( _state._isReviewNeeded ) return;

                    setTimeout( Adapt.bottomnavigation.render, 500) 

                });

            }

        });
    };*/



//GLOBAL DEBUGGING HACKS
    //COMPLETE ASSESSMENT FAILED AND OPEN RESULTS SCREEN
    window.LACompleteAssessment = function() {
        var assessmentView = Adapt.articles.find(function(it) { return typeof it.get('_assessment') !== "undefined"; } );
        Adapt.navigateToElement(assessmentView.get("_id"));
        setTimeout( function () {
            Adapt.trigger("assessment:complete", assessmentView.get("assessmentModel").getQuestionModel());
        }, 1000);
    };

    //COMPLETE ASSESSMENT PASSED AND OPEN CERTIFICATE SCREEN
    window.LACompleteAssessmentPassed = function() {
        var assessmentView = Adapt.articles.find(function(it) { return typeof it.get('_assessment') !== "undefined"; } );
        Adapt.navigateToElement(assessmentView.get("_id"));
        var questionModel = assessmentView.get("assessmentModel").getQuestionModel();
        _.each(questionModel.allQuestions, function(question) {
            question._isCorrect = true;
        });
        questionModel.isPass = true;
        questionModel.score = _.keys( questionModel.allQuestions ).length;
        questionModel.scoreAsPercent = 100;
        setTimeout( function () {
            Adapt.trigger("assessment:complete", questionModel);
            Adapt.bottomnavigation.render();
        }, 1000);
    };


    //ADD TRIM TO STRING
    if(typeof String.prototype.trim !== 'function') {
      String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, ''); 
      }
    }

});