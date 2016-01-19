var _ = require('lodash'),
    util = require('./util.js'),
    GitHubApi = require("github"),
    github = new GitHubApi({ version: '3.0.0' });

var pickInputs = {
        'owner': { key: 'user', validate: { req: true }},
        'repo': 'repo'
    },
    pickOutputs = {
        'id': { key: 'data', fields: ['id'] },
        'repo_id': { key: 'data', fields: ['repo.id'] },
        'repo_name': { key: 'data', fields: ['repo.name'] },
        'repo_url': { key: 'data', fields: ['repo.url'] },
        'actor_login': { key: 'data', fields: ['actor.login'] },
        'org_id': { key: 'data', fields: ['org.id'] },
        'org_login': { key: 'data', fields: ['org.login'] }
    };

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var credentials = dexter.provider('github').credentials(),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        // check params.
        if (validateErrors)
            return this.fail(validateErrors);

        github.authenticate({
            type: 'oauth',
            token: _.get(credentials, 'access_token')
        });

        var func = _.get(inputs, 'repo')? github.events.getFromRepo : github.events.getFromUser;

        func(inputs, function (error, events) {

            error? this.fail(error) : this.complete(util.pickOutputs({ data: events }, pickOutputs));
        }.bind(this));
    }
};
