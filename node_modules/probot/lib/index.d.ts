/// <reference types="node" />
import { App as OctokitApp } from '@octokit/app';
import Octokit from '@octokit/rest';
import Webhooks from '@octokit/webhooks';
import Logger from 'bunyan';
import express from 'express';
import Redis from 'ioredis';
import { Server } from 'http';
import { Application } from './application';
import { Context } from './context';
export declare class Probot {
    static run(appFn: ApplicationFunction | string[]): Promise<Probot>;
    server: express.Application;
    httpServer?: Server;
    webhook: Webhooks;
    logger: Logger;
    options: Options;
    app?: OctokitApp;
    throttleOptions: any;
    private apps;
    private githubToken?;
    private Octokit;
    constructor(options: Options);
    errorHandler(err: Error): void;
    receive(event: Webhooks.WebhookEvent<any>): Promise<[void, void, void][]>;
    load(appFn: string | ApplicationFunction): Application;
    setup(appFns: Array<string | ApplicationFunction>): void;
    start(): void;
}
export declare const createProbot: (options: Options) => Probot;
export declare type ApplicationFunction = (app: Application) => void;
export interface Options {
    webhookPath?: string;
    secret?: string;
    id?: number;
    cert?: string;
    githubToken?: string;
    webhookProxy?: string;
    port?: number;
    redisConfig?: Redis.RedisOptions;
    Octokit?: Octokit.Static;
}
export { Logger, Context, Application, Octokit };
