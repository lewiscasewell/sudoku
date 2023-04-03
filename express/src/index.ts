import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";

import { baseRouter } from "./server/api/base";
import { v1Router } from "./server/api/v1";

const PORT = process.env.PORT || 8080;

const startServer = () => {
  const app = express();

  app.use(
    cors({
      origin: (_origin, cb) => cb(null, true),
      credentials: true,
      exposedHeaders: ["Content-Range"],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan("common"));

  app.use("/", baseRouter);
  app.use("/api/v1", v1Router);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    return res.status(500).json({ message: err.message });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

export default startServer;
