import dotenv from "dotenv";
dotenv.config();

import express from "express";

const PORT = process.env.PORT || 8080;

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(8080, () => {
  console.log(`Server running on port ${PORT}`);
});
