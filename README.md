adapt-assessment-learnerAssistant
=================================

Shows associated learning from assessment and navigates between flagged items

Requires: adapt-rollay, adapt-bottomnavigation


//course.json
"_banks" : {
    "1": {
        "title": "Bank1 - Learning outcome etc."
    },
    "2": {
        "title": "Bank2 - Learning outcome etc."
    }
    //bank ids + titles
},
"_learnerassistant": {
    "_showAllBankQuestions": false, //all questions (true) or only failed questions(false)
    "_showAssociatedLearningBy": "bank" // bank or id
}
