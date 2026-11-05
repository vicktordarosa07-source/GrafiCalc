export declare class ResponseBodyTooLargeError extends Error {}
export declare function readResponseTextLimited(response: Response, maxBytes: number): Promise<string>;
