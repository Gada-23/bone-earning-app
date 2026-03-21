require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const logger = require("./utils/logger");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(morgan("combined"));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Bone Earn API is running" });
});

app.use("/api", userRoutes);

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong" });
});

connectDB();

module.exports = app;
