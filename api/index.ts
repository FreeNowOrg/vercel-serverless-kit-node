import { HandeleRouter } from '../src/modules/HandleRouter'

const router = new HandeleRouter()

router.beforeEach<{
  db: string
}>(async ctx => {
  console.log('db instance connected')
  await new Promise(i => setTimeout(i, 100))
  ctx.db = 'DATABASE'
})

router.afterEach(async ctx => {
  await new Promise(i => setTimeout(i, 100))
  console.log('db instance closed')
})

router.endpoint('api/config/')

router
  .addRoute()
  .method('GET')
  .path('a')
  .path(['b', 'B'])
  .path(/.+/, 'keyInfo')
  .check<{
    foo: string
  }>(ctx => {
    console.log('specific check 1')
    ctx.foo = 'bar'
  })
  .check(() => {
    console.log('specific chechk2')
  })
  .action(ctx => {
    ctx.message = 'hello, world'
    ctx.body = {
      keyInfo: ctx.params.keyInfo,
      db: ctx.db,
    }
  })

router.beforeEach(() => {
  console.log('before each 1')
})

router.beforeEach(() => {
  console.log('before each 2')
})

export default router.init
