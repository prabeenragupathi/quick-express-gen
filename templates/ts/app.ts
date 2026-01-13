import express, { Request, Response, Application } from "express";
import cors from "cors";
import { errorHandler } from "#utils/error.js";

const app:Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from Quick Express Gen!"});
});

//! error handler middleware
app.use(errorHandler);

export default app;