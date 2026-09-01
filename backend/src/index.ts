import { runHealthServer } from './health'
import { runScheduler } from './scheduler'
import { runServer } from './server'

runHealthServer()
runServer().catch(error => {
    console.error(error)
    process.exit(1)
})
runScheduler()
