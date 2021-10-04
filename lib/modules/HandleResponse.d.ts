import { VercelRequest, VercelResponse } from '@vercel/node';
/**
 * @module HandleResponse
 */
export declare class HandleResponse {
    req: VercelRequest;
    res: VercelResponse;
    _start: number;
    _env: 'prod' | 'dev';
    _debug: boolean;
    constructor(req: VercelRequest, res: VercelResponse);
    send(code: number, message: string, body?: any, custom?: any): VercelResponse;
    axiosError(e: any): VercelResponse;
    mongoError(e: any): VercelResponse;
}
