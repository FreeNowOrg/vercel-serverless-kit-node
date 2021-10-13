# vercel-serverless-kit-node

Vercel Serverless function kits for Node.js

## `HandleRouter` 路由工具类

**returns:** `Router` 类

<details>

<summary>完整示例</summary>

我们假定一个博客系统的 API。

```ts
import { HandleRouter } from 'serverless-kit'
const router = new HandleRouter()

// 预连接数据库
router.beforeEach(async (ctx) => {
  const client = new MongoClient(/* ... */)
  await client.connect()
  ctx.mongodb = client
})

// 关闭数据库连接
router.afterEach(async (ctx) => {
  await ctx.mongodb.close()
})

// 预获取用户数据
router.beforeEach(async (ctx) => {
  ctx.user = await getUserDataByReq(ctx.req)
})

// @route 更新博文
// @example `PATCH /post/pid/1`
router
  .addRoute()
  .method('PATCH')
  .path('post')
  .path(['uuid', 'pid'], 'selector')
  .path(/^.+$/, 'identity')
  .check((ctx) => {
    // 验证参数
    const body = ctx.http.req.body
    if (!body || body.title === undefined || body.content === undefined) {
      ctx.http.send(400, 'Missing params')
      return false
    }
  })
  .check(async (ctx) => {
    // 查找目标帖子
    // 注意，这里添加了新的上下文 post，下文是可以用的
    ctx.post = await ctx.db.collection('posts').findOne(/* ... */)

    if (!ctx.post) {
      ctx.status = 404
      ctx.message = 'Post not found'
      return false
    }
  })
  .check((ctx) => {
    // 用户鉴权
    if (post.author_uuid !== user.uuid && ctx.user.authority <= 3) {
      ctx.http.send(403, 'Permission denied')
      return false
    }
  })
  .check(async (ctx) => {
    // 检查 slug 冲突
    if (ctx.req.body.slug !== ctx.post.slug) {
      // ...
      if (conflict) {
        ctx.status = 409
        ctx.message = 'Slug has been taken'
        return false
      }
    }
  })
  // ...
  // 其他验证
  // ...
  .action((ctx) => {
    // 没有问题啦，更新数据库里的数据！
    // ...
    ctx.status = 200
    ctx.message = 'ok'
  })

// 导出，并初始化
export default router.init
```

</details>

### types

```ts
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
```

### `init(req: VercelRequest, res: VercelResponse): void`

初始化实例。

导出什么都无所谓……

你可以直接 `export default router.init`

### `addRoute(): Route`

添加一个路由。见 `Route`。

### `beforeEach(callback: Action): this`

在每一个成功匹配的请求前执行的 `check`。

### `afterEach(callback: Action): this`

在每一个成功匹配的请求主函数执行结束后的操作。

## `Route` 路由类 [internal]

可以链式调用。

### `method(method: Method): this`

注册匹配的 HTTP method

### `path(filter: string | string[] | RegExp, name?: string): this`

`path` 接受 `string` `string[]` 或者 `RegExp` 作为匹配规则。

`path` 可以是具名的，如果具名则会被认定为 `param`，具名的 `path` 在验证时如果匹配成功则会在上下文 `params` 里具名传递。

用户请求的 `path` 会以 `/` 分割，每一项按 `path` 注册的顺序逐一匹配。

### `action(callback: Action): this`

注册一个路由的主操作。

`action` 有且只能有一个，后注册的会覆盖先前注册的。

### `check(callback: Action, prepend?: boolean): this`

事实上与 `action` 几乎一致，当检查到 `false` 返回值时直接终止链。

`check` 可以有无数个，在 `action` 之前按注册顺序执行。

可用于判断是否登录、是否有权限等，以便提前终止实际操作。

## `getProjectSrotFromStr(str: string): Record<string, 1 | -1>` MongoDB 过滤器生成器

**Sample:** `getProjectSrotFromStr('foo|!bar')` → `{ foo: 1, bar: -1 }`