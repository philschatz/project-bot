import { GitHubAPI } from './';
export interface GraphQLError {
    message: string;
    locations?: Array<{
        line: number;
        column: number;
    }>;
    path?: Array<string | number>;
    extensions?: {
        [key: string]: any;
    };
}
export declare function addGraphQL(client: GitHubAPI): void;
