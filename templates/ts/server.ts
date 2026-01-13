import app from "./app.ts";
import { PORT } from "#config/env.ts";

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
};

startServer();