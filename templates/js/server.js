import app from "./app";
import { PORT } from "@config/env";

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
};

startServer();