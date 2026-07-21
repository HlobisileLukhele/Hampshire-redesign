const express = require("express");
const { pool } = require("../db/pool");

const router = express.Router();

router.get("/", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Health check database failure:", error.message);
    response.status(503).json({ status: "unavailable" });
  }
});

module.exports = router;
