import { runHealthServer } from './health'
import { runScheduler } from './scheduler'
import { runServer } from './server'

runHealthServer()
runServer()
runScheduler()
