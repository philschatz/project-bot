import { App as OctokitApp } from '@octokit/app';
import Octokit from '@octokit/rest';
import Webhooks from '@octokit/webhooks';
import express from 'express';
import { EventEmitter } from 'promise-events';
import { ApplicationFunction } from '.';
import { Cache } from './cache';
import { Context } from './context';
import { GitHubAPI } from './github';
import { LoggerWithTarget } from './wrap-logger';
export interface Options {
    app: OctokitApp;
    cache: Cache;
    router?: express.Router;
    catchErrors?: boolean;
    githubToken?: string;
    throttleOptions?: any;
    Octokit?: Octokit.Static;
}
export declare type OnCallback<T> = (context: Context<T>) => Promise<void>;
/**
 * The `app` parameter available to `ApplicationFunction`s
 *
 * @property {logger} log - A logger
 */
export declare class Application {
    events: EventEmitter;
    app: OctokitApp;
    cache: Cache;
    router: express.Router;
    log: LoggerWithTarget;
    private githubToken?;
    private throttleOptions;
    private Octokit;
    constructor(options?: Options);
    /**
     * Loads an ApplicationFunction into the current Application
     * @param appFn - Probot application function to load
     */
    load(appFn: ApplicationFunction | ApplicationFunction[]): Application;
    receive(event: Webhooks.WebhookEvent<any>): Promise<[void, void, void]>;
    /**
     * Get an {@link http://expressjs.com|express} router that can be used to
     * expose HTTP endpoints
     *
     * ```
     * module.exports = app => {
     *   // Get an express router to expose new HTTP endpoints
     *   const route = app.route('/my-app');
     *
     *   // Use any middleware
     *   route.use(require('express').static(__dirname + '/public'));
     *
     *   // Add a new route
     *   route.get('/hello-world', (req, res) => {
     *     res.end('Hello World');
     *   });
     * };
     * ```
     *
     * @param path - the prefix for the routes
     * @returns an [express.Router](http://expressjs.com/en/4x/api.html#router)
     */
    route(path?: string): express.Router;
    /**
     * Listen for [GitHub webhooks](https://developer.github.com/webhooks/),
     * which are fired for almost every significant action that users take on
     * GitHub.
     *
     * @param event - the name of the [GitHub webhook
     * event](https://developer.github.com/webhooks/#events). Most events also
     * include an "action". For example, the * [`issues`](
     * https://developer.github.com/v3/activity/events/types/#issuesevent)
     * event has actions of `assigned`, `unassigned`, `labeled`, `unlabeled`,
     * `opened`, `edited`, `milestoned`, `demilestoned`, `closed`, and `reopened`.
     * Often, your bot will only care about one type of action, so you can append
     * it to the event name with a `.`, like `issues.closed`.
     *
     * ```js
     * app.on('push', context => {
     *   // Code was just pushed.
     * });
     *
     * app.on('issues.opened', context => {
     *   // An issue was just opened.
     * });
     * ```
     *
     * @param callback - a function to call when the
     * webhook is received.
     */
    on(event: 'check_run' | 'check_run.completed' | 'check_run.created' | 'check_run.requested_action' | 'check_run.rerequested', callback: OnCallback<Webhooks.WebhookPayloadCheckRun>): void;
    on(event: 'check_suite' | 'check_suite.completed' | 'check_suite.requested' | 'check_suite.rerequested', callback: OnCallback<Webhooks.WebhookPayloadCheckSuite>): void;
    on(event: 'commit_comment' | 'commit_comment.created', callback: OnCallback<Webhooks.WebhookPayloadCommitComment>): void;
    on(event: 'create', callback: OnCallback<Webhooks.WebhookPayloadCreate>): void;
    on(event: 'delete', callback: OnCallback<Webhooks.WebhookPayloadDelete>): void;
    on(event: 'deployment', callback: OnCallback<Webhooks.WebhookPayloadDeployment>): void;
    on(event: 'deployment_status', callback: OnCallback<Webhooks.WebhookPayloadDeploymentStatus>): void;
    on(event: 'fork', callback: OnCallback<Webhooks.WebhookPayloadFork>): void;
    on(event: 'github_app_authorization', callback: OnCallback<Webhooks.WebhookPayloadGithubAppAuthorization>): void;
    on(event: 'gollum', callback: OnCallback<Webhooks.WebhookPayloadGollum>): void;
    on(event: 'installation' | 'installation.created' | 'installation.deleted', callback: OnCallback<Webhooks.WebhookPayloadInstallation>): void;
    on(event: 'installation_repositories' | 'installation_repositories.added' | 'installation_repositories.removed', callback: OnCallback<Webhooks.WebhookPayloadInstallationRepositories>): void;
    on(event: 'issue_comment' | 'issue_comment.created' | 'issue_comment.deleted' | 'issue_comment.edited', callback: OnCallback<Webhooks.WebhookPayloadIssueComment>): void;
    on(event: 'issues' | 'issues.assigned' | 'issues.closed' | 'issues.deleted' | 'issues.demilestoned' | 'issues.edited' | 'issues.labeled' | 'issues.milestoned' | 'issues.opened' | 'issues.reopened' | 'issues.transferred' | 'issues.unassigned' | 'issues.unlabeled', callback: OnCallback<Webhooks.WebhookPayloadIssues>): void;
    on(event: 'label' | 'label.created' | 'label.deleted' | 'label.edited', callback: OnCallback<Webhooks.WebhookPayloadLabel>): void;
    on(event: 'marketplace_purchase' | 'marketplace_purchase.cancelled' | 'marketplace_purchase.changed' | 'marketplace_purchase.pending_change' | 'marketplace_purchase.pending_change_cancelled' | 'marketplace_purchase.purchased', callback: OnCallback<Webhooks.WebhookPayloadMarketplacePurchase>): void;
    on(event: 'member' | 'member.added' | 'member.deleted' | 'member.edited', callback: OnCallback<Webhooks.WebhookPayloadMember>): void;
    on(event: 'membership' | 'membership.added' | 'membership.removed', callback: OnCallback<Webhooks.WebhookPayloadMembership>): void;
    on(event: 'milestone' | 'milestone.closed' | 'milestone.created' | 'milestone.deleted' | 'milestone.edited' | 'milestone.opened', callback: OnCallback<Webhooks.WebhookPayloadMilestone>): void;
    on(event: 'organization' | 'organization.member_added' | 'organization.member_invited' | 'organization.member_removed', callback: OnCallback<Webhooks.WebhookPayloadOrganization>): void;
    on(event: 'org_block' | 'org_block.blocked' | 'org_block.unblocked', callback: OnCallback<Webhooks.WebhookPayloadOrgBlock>): void;
    on(event: 'page_build', callback: OnCallback<Webhooks.WebhookPayloadPageBuild>): void;
    on(event: 'project_card' | 'project_card.converted' | 'project_card.created' | 'project_card.deleted' | 'project_card.edited' | 'project_card.moved', callback: OnCallback<Webhooks.WebhookPayloadProjectCard>): void;
    on(event: 'project_column' | 'project_column.created' | 'project_column.deleted' | 'project_column.edited' | 'project_column.moved', callback: OnCallback<Webhooks.WebhookPayloadProjectColumn>): void;
    on(event: 'project' | 'project.closed' | 'project.created' | 'project.deleted' | 'project.edited' | 'project.reopened', callback: OnCallback<Webhooks.WebhookPayloadProject>): void;
    on(event: 'public', callback: OnCallback<Webhooks.WebhookPayloadPublic>): void;
    on(event: 'pull_request' | 'pull_request.assigned' | 'pull_request.closed' | 'pull_request.edited' | 'pull_request.labeled' | 'pull_request.opened' | 'pull_request.reopened' | 'pull_request.review_request_removed' | 'pull_request.review_requested' | 'pull_request.unassigned' | 'pull_request.unlabeled' | 'pull_request.synchronize', callback: OnCallback<Webhooks.WebhookPayloadPullRequest>): void;
    on(event: 'pull_request_review' | 'pull_request_review.dismissed' | 'pull_request_review.edited' | 'pull_request_review.submitted', callback: OnCallback<Webhooks.WebhookPayloadPullRequestReview>): void;
    on(event: 'pull_request_review_comment' | 'pull_request_review_comment.created' | 'pull_request_review_comment.deleted' | 'pull_request_review_comment.edited', callback: OnCallback<Webhooks.WebhookPayloadPullRequestReviewComment>): void;
    on(event: 'push', callback: OnCallback<Webhooks.WebhookPayloadPush>): void;
    on(event: 'release' | 'release.published', callback: OnCallback<Webhooks.WebhookPayloadRelease>): void;
    on(event: 'repository' | 'repository.archived' | 'repository.created' | 'repository.deleted' | 'repository.privatized' | 'repository.publicized' | 'repository.unarchived', callback: OnCallback<Webhooks.WebhookPayloadRepository>): void;
    on(event: 'repository_import', callback: OnCallback<Webhooks.WebhookPayloadRepositoryImport>): void;
    on(event: 'repository_vulnerability_alert' | 'repository_vulnerability_alert.create' | 'repository_vulnerability_alert.dismiss' | 'repository_vulnerability_alert.resolve', callback: OnCallback<Webhooks.WebhookPayloadRepositoryVulnerabilityAlert>): void;
    on(event: 'security_advisory' | 'security_advisory.performed' | 'security_advisory.published' | 'security_advisory.updated', callback: OnCallback<Webhooks.WebhookPayloadSecurityAdvisory>): void;
    on(event: 'status', callback: OnCallback<Webhooks.WebhookPayloadStatus>): void;
    on(event: 'team' | 'team.added_to_repository' | 'team.created' | 'team.deleted' | 'team.edited' | 'team.removed_from_repository', callback: OnCallback<Webhooks.WebhookPayloadTeam>): void;
    on(event: 'team_add', callback: OnCallback<Webhooks.WebhookPayloadTeamAdd>): void;
    on(event: 'watch' | 'watch.started', callback: OnCallback<Webhooks.WebhookPayloadWatch>): void;
    on(eventName: string | string[], callback: OnCallback<any>): void;
    /**
     * Authenticate and get a GitHub client that can be used to make API calls.
     *
     * You'll probably want to use `context.github` instead.
     *
     * **Note**: `app.auth` is asynchronous, so it needs to be prefixed with a
     * [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
     * to wait for the magic to happen.
     *
     * ```js
     *  module.exports = (app) => {
     *    app.on('issues.opened', async context => {
     *      const github = await app.auth();
     *    });
     *  };
     * ```
     *
     * @param id - ID of the installation, which can be extracted from
     * `context.payload.installation.id`. If called without this parameter, the
     * client wil authenticate [as the app](https://developer.github.com/apps/building-integrations/setting-up-and-registering-github-apps/about-authentication-options-for-github-apps/#authenticating-as-a-github-app)
     * instead of as a specific installation, which means it can only be used for
     * [app APIs](https://developer.github.com/v3/apps/).
     *
     * @returns An authenticated GitHub API client
     * @private
     */
    auth(id?: number, log?: LoggerWithTarget): Promise<GitHubAPI>;
    private authenticateEvent;
}
