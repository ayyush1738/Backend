import express from 'express'
import cors from 'cors'
import healthcheckRouter from './routes/healthcheck.routes.js';

const app = express();
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({ extended:true , limit: "16kb"}))
app.use(express.static("public"))

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

app.use("/api/v1/healthcheck", healthcheckRouter);

export default app;