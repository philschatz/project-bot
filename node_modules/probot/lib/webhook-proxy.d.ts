import Logger from 'bunyan';
import EventSource from 'eventsource';
export declare const createWebhookProxy: (opts: WebhookProxyOptions) => EventSource | undefined;
export interface WebhookProxyOptions {
    url?: string;
    port?: number;
    path?: string;
    logger: Logger;
}
