import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./env.js";
import { errorHandler, notFound } from "./lib/http.js";
import { docsRouter } from "./routes/docs.js";
import { waitlistRouter } from "./routes/waitlist.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/docs", docsRouter);
app.use("/waitlist", waitlistRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Waitlist API listening on port ${env.port} (${env.nodeEnv})`);
});
