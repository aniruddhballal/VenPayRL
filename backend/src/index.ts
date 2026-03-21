import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { router } from './routes'

dotenv.config()

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL,
}))

app.use(express.json())
app.use('/api', router)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 running on ${PORT}`))