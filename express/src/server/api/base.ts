import { Router } from "express";

const baseRouter = Router();

baseRouter.get("/", (_req, res) => {
  return res.json({ message: "you alright babes" });
});

export { baseRouter };
