const express = require("express");
const router = express.Router();
const db = require("./db");

// GET /stock/available
router.get("/stock/available", async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id AS "planId",
        p.name AS "planName",
        COUNT(c.id) AS "available"
      FROM plans p
      LEFT JOIN cards c ON p.id = c.plan_id AND c.status = 'ready'
      GROUP BY p.id, p.name
      ORDER BY p.id;
    `;

    const result = await db.query(query);
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
