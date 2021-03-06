import { HandleRouter, RouteContextDefaults } from '../src/modules/HandleRouter'
import { MongoClient } from 'mongodb'

declare module '../src/modules/HandleRouter' {
  interface HandleRouter<ContextT extends unknown = RouteContextDefaults> {
    setA: (s: string) => HandleRouter<RouteContextDefaults & ContextT & { a: string }>
  }
}

HandleRouter.prototype.setA = function (s: string) {
  this.ctx.a = s
  return this as HandleRouter<RouteContextDefaults & { a: typeof s }>
}

const router = new HandleRouter<{
  db: MongoClient
}>()

router.setA('1').beforeEach((ctx) => {
  ctx.a
})

router.beforeEach(async (ctx) => {
  console.log('db instance connected')
  await new Promise((i) => setTimeout(i, 100))
  ctx.db = new MongoClient('mongodb://localhost')
})

router.afterEach(async (ctx) => {
  await new Promise((i) => setTimeout(i, 100))
  console.log('db instance closed')
})

router.endpoint('/api')

router
  .addRoute()
  .method('GET')
  .path('a')
  .path(['b', 'B'])
  .path(/.+/, 'keyInfo')
  .check<{
    foo: string
  }>((ctx) => {
    console.log('specific check 1')
    ctx.foo = 'bar'
  })
  .check(() => {
    console.log('specific chechk2')
  })
  .action((ctx) => {
    ctx.message = 'hello, world'
    ctx.body = {
      keyInfo: ctx.params.keyInfo,
    }
  })

router.beforeEach(() => {
  console.log('before each 1')
})

router.beforeEach(() => {
  console.log('before each 2')
})

export default router.init
