import { VercelRequest, VercelResponse } from '@vercel/node'
import { HandleResponse } from '..'

export class HandeleRouter {
  private _routeList: Route[] = []
  init: (req: VercelRequest, res: VercelResponse) => Promise<void>
  private handleSend: (ctx: Context) => any
  private handleNotFound: () => any
  private handleError: (ctx: Context, error: unknown) => any
  private _afterList: Action[] = []
  private _beforeList: Action[] = []
  private _endpoint: string | RegExp = /^\/api\/?/
  http!: HandleResponse

  constructor() {
    // Make init
    this.init = (req: VercelRequest, res: VercelResponse) =>
      this._runInit(req, res)

    // Default handlers
    this.handleSend = (ctx) => {
      this.http.send(
        ctx.status || 200,
        ctx.message || 'ok',
        ctx.body,
        ctx.customBody
      )
    }
    this.handleNotFound = () => {
      this.http.send(404, 'Invalid endpoint')
    }
    this.handleError = (ctx, error) => {
      this.http.send(
        ctx.status,
        ctx.message || 'Internal server error',
        ctx.body,
        { error, ...ctx.customBody }
      )
    }
  }

  addRoute(): Route {
    const route = new Route()
    route.endpoint(this._endpoint)
    this._routeList.unshift(route)
    return route
  }

  /**
   * @param path e.g. `"/api/foo"` or `/^\/api\/(foo|bar)\/?/`
   */
  endpoint(path: string | RegExp) {
    this._endpoint = path
    return this
  }

  private async _runInit(req: VercelRequest, res: VercelResponse) {
    this.http = new HandleResponse(req, res)

    let isMatched = false
    for (const route of this._routeList) {
      this._beforeList.forEach((i) => route.check(i, true))

      const { matched, ctx } = await route.init(req, res)

      if (matched) {
        isMatched = true

        try {
          for (const action of this._afterList) await action(ctx)
          this.handleSend(ctx)
        } catch (e) {
          this.handleError(ctx, e)
        }

        break
      }
    }

    if (!isMatched) {
      this.handleNotFound()
    }
  }

  /**
   * @desc Define the send handler
   * @example ```ts
   * (ctx) => ctx.http.send(ctx.status, ctx.message, ctx.body)
   * ```
   */
  done(handler: (ctx: Context) => void) {
    this.handleSend = handler
  }

  /**
   * @desc Define the error handler
   */
  fail(handler: (ctx: Context) => void) {
    this.handleError = handler
  }

  beforeEach(callback: Action) {
    this._beforeList.unshift(callback)
    return this
  }

  afterEach(callback: Action) {
    this._afterList.push(callback)
    return this
  }
}

type Method =
  | 'GET'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'PURGE'
  | 'LINK'
  | 'UNLINK'

type Context = {
  req: VercelRequest
  res: VercelResponse
  params: Record<string, string>
  status: number
  message: string
  body: any
  customBody?: any
} & Record<string, any>

type Awaitable<T> = Promise<T> | T

type Action = (ctx: Context) => Awaitable<false | any>

type Path = string | string[] | RegExp

class Route {
  private _method: Method = 'GET'
  private _pathList: { name?: string; checker: Path }[] = []
  private _action: Action | undefined
  private _checkList: Action[] = []
  http!: HandleResponse

  // 初始化 Context
  public ctx: Context = {} as Context
  private _endpoint: string | RegExp = /^\/api\/?/

  constructor() {
    this.ctx.params = {}
    this.ctx.status = 200
    this.ctx.message = ''
  }

  /**
   * @param path e.g. `"/api/foo"` or `/^\/api\/(foo|bar)\/?/`
   */
  endpoint(path: string | RegExp) {
    if (typeof path === 'string') {
      this._endpoint = new RegExp(
        `/${path.replace(/^\//g, '').replace(/\/$/g, '')}`
      )
    } else {
      this._endpoint = path
    }

    return this
  }

  method(m: Method) {
    this._method = m.toUpperCase() as Method
    return this
  }

  path(path: Path, name?: string) {
    this._pathList.push({ checker: path, name })
    if (name) this.ctx.params[name] = ''
    return this
  }

  check(callback: Action, prepend?: boolean) {
    if (!prepend) {
      this._checkList.push(callback)
    } else {
      this._checkList.unshift(callback)
    }
    return this
  }

  action(callback: Action) {
    this._action = callback
    return this
  }

  async init(
    req: VercelRequest,
    res: VercelResponse
  ): Promise<{ matched: boolean; ctx: Context }> {
    this.ctx.req = req
    this.ctx.res = res

    if (!this._matchMethod()) {
      return { matched: false, ctx: this.ctx }
    }
    if (!this._matchPath()) {
      return { matched: false, ctx: this.ctx }
    }
    if (!(await this._runChecks())) {
      return { matched: true, ctx: this.ctx }
    }

    await this._runAction()
    return { matched: true, ctx: this.ctx }
  }

  private _matchMethod() {
    return this.ctx.req.method === this._method
  }

  private _matchPath() {
    const url = this.ctx.req.url as string
    const paths = url
      .split(this._endpoint)
      .pop()
      ?.split('?')
      .shift()
      ?.replace(/^\//g, '')
      .replace(/\/$/g, '')
      ?.split('/') as string[]

    let isOk = true

    if (paths.length !== this._pathList.length) return false

    for (let index = 0; index < paths.length; index++) {
      const item = paths[index]
      const name = this._pathList[index].name
      const checker = this._pathList[index].checker

      if (typeof checker === 'string') {
        isOk = checker === item
      } else if (Array.isArray(checker)) {
        isOk = checker.includes(item)
      } else {
        isOk = checker.test(item)
      }

      if (!isOk) {
        break
      }

      if (name) {
        this.ctx.params[name] = item
      }
    }

    return isOk
  }

  private async _runChecks() {
    let isOk = true
    for (const callback of this._checkList) {
      const result = await callback(this.ctx)
      if (result === false) {
        isOk = false
        break
      }
    }
    return isOk
  }

  async _runAction() {
    this._action && (await this._action(this.ctx))
    return true
  }
}
