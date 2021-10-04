"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleResponse = void 0;
/**
 * @module HandleResponse
 */
class HandleResponse {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this._start = Date.now();
        this._debug = this.req.query.debug ? true : false;
        this._env =
            process.env.NODE_ENV === 'development' || this.req.query.devMode
                ? 'dev'
                : 'prod';
    }
    send(code, message, body = {}, custom) {
        return this.res.status(code).send({
            code,
            message,
            devMode: this._env === 'dev' ? true : undefined,
            ping: this._debug ? { start: this._start, end: Date.now() } : undefined,
            body,
            ...custom,
        });
    }
    axiosError(e) {
        var _a, _b;
        console.error('[SERVER]', 'Axios Error', e);
        return this.send(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.status) || 500, `Internal network error: ${e.message}`, {}, { error: ((_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) || e });
    }
    mongoError(e) {
        console.error('[SERVER]', 'Mongo Error', e);
        return this.send(500, `Internal database error: ${e.message}`, {}, { error: e });
    }
}
exports.HandleResponse = HandleResponse;
//# sourceMappingURL=HandleResponse.js.map