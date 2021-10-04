import { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * @module HandleResponse
 */
export class HandleResponse {
  req: VercelRequest
  res: VercelResponse
  _start: number
  _env: 'prod' | 'dev'
  _debug: boolean

  constructor(req: VercelRequest, res: VercelResponse) {
    this.req = req
    this.res = res
    this._start = Date.now()
    this._debug = this.req.query.debug ? true : false
    this._env =
      process.env.NODE_ENV === 'development' || this.req.query.devMode
        ? 'dev'
        : 'prod'
  }

  send(code: number, message: string, body = {} as any, custom?: any) {
    return this.res.status(code).send({
      code,
      message,
      devMode: this._env === 'dev' ? true : undefined,
      ping: this._debug ? { start: this._start, end: Date.now() } : undefined,
      body,
      ...custom,
    })
  }

  axiosError(e: any) {
    console.error('[SERVER]', 'Axios Error', e)
    return this.send(
      e?.response?.status || 500,
      `Internal network error: ${e.message}`,
      {},
      { error: e?.response?.data || e }
    )
  }

  mongoError(e: any) {
    console.error('[SERVER]', 'Mongo Error', e)
    return this.send(
      500,
      `Internal database error: ${e.message}`,
      {},
      { error: e }
    )
  }
}
