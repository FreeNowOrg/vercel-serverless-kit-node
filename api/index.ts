import { HandeleRouter } from '../src/modules/HandleRouter'

const router = new HandeleRouter()

router.beforeEach(async (ctx) => {
  console.log('db instance connected')
  await new Promise((i) => setTimeout(i, 100))
  ctx.db = 'DATABASE'
})

router.afterEach(async (ctx) => {
  await new Promise((i) => setTimeout(i, 100))
  console.log('db instance closed')
})

router
  .addRoute()
  .method('GET')
  .path('a')
  .path(['b', 'B'])
  .path(/.+/, 'keyInfo')
  .check(() => {
    console.log('specific chech 1')
  })
  .check(() => {
    console.log('specific chech 2')
  })
  .action((ctx) => {
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
