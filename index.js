var GitHubApi = require("github");
var _ = require('lodash');

var pickResultData = [
    'id',
    'created_at',
    'repo.id',
    'repo.name',
    'repo.url',
    'actor.login',
    'org.id',
    'org.login'
];

module.exports = {
    /**
     * Pick API result.
     *
     * @param events
     * @returns {Array}
     */
    pickResultData: function (events) {
        var result = [];

        _.map(events, function (event, eventKey) {
            var tmpPickResult = {};

            pickResultData.forEach(function (dataKey) {
                if (!_.isUndefined(_.get(event, dataKey, undefined))) {

                    _.set(tmpPickResult, dataKey, _.get(event, dataKey));
                }
            });
            result[eventKey] = tmpPickResult;
        });

        return result;
    },

    /**
     * Authenticate gitHub user.
     *
     * @param dexter
     * @param github
     */
    gitHubAuthenticate: function (dexter, github) {

        if (dexter.environment('GitHubUserName') && dexter.environment('GitHubPassword')) {

            github.authenticate({
                type: dexter.environment('GitHubType') || "basic",
                username: dexter.environment('GitHubUserName'),
                password: dexter.environment('GitHubPassword')
            });
        } else {
            this.fail('A GitHubUserName and GitHubPassword environment variable is required for this module');
        }
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {

        var github = new GitHubApi({
            // required 
            version: "3.0.0"
        });

        this.gitHubAuthenticate(dexter, github);

        if (step.input('owner').first()) {

            var runFunc = step.input('repo').first()?
                github.events.getFromRepo.bind(null, {
                    user: step.input('owner').first(),
                    repo: step.input('repo').first()
                }) : github.events.getFromUser.bind(null, {
                    user: step.input('owner').first()
                });

            runFunc(function (err, events) {

                //console.log(err, events);

                err? this.fail(err) : this.complete(this.pickResultData(events));
            }.bind(this));
        } else {

            this.fail('A owner input variable is required for this module');
        }
    }
};
