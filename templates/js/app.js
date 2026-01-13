import express from "express";
import cors from "cors";
import { errorHandler } from "#utils/error.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello from Quick Express Gen!"});
});

//! error handler middleware
app.use(errorHandler);

export default app;