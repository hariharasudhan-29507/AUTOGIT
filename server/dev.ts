import 'dotenv/config'
import { serve } from '@hono/node-server'
import { createApp } from './app'

const port = Number(process.env.API_PORT ?? 8787)
const app = createApp()

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`AutoGit API listening on http://localhost:${info.port}`)
})
