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

  addRoute() {
    const route = new Route()
    this._routeList.unshift(route)
    return route
  }

  private async _runInit(req: VercelRequest, res: VercelResponse) {
    this.http = new HandleResponse(req, res)

    let isMatched = false
    for (const route of this._routeList) {
      this._beforeList.reverse().forEach((a) => route.check(a, true))

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
    this._beforeList.push(callback)
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
  private _method: Method | '' = ''
  private _pathList: { name?: string; checker: Path }[] = []
  private _action: Action | undefined
  private _checkList: Action[] = []
  private _afterList: Action[] = []
  http!: HandleResponse

  // 初始化 Context
  public ctx: Context = {} as Context

  constructor() {
    this.ctx.params = {}
    this.ctx.status = 200
    this.ctx.message = ''
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
      .split(/\/api\/?/)
      .pop()
      ?.split('?')
      .shift()
      ?.split('/') as string[]

    let isOk = true
    paths.forEach((item, index) => {
      const checker = this._pathList[index].checker
      const name = this._pathList[index].name

      if (typeof checker === 'string') {
        isOk = checker === item
      } else if (Array.isArray(checker)) {
        isOk = checker.includes(item)
      } else {
        isOk = checker.test(item)
      }

      if (name && isOk) this.ctx.params[name] = item
    })

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
