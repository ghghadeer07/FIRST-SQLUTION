const db = require("../db");

// GET /stock/sold
async function getSoldStock(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        plans.id AS plan_id,
        plans.name AS plan_name,
        COUNT(stock.id) AS sold_count
      FROM plans
      LEFT JOIN stock ON plans.id = stock.plan_id AND stock.status = 'sold'
      GROUP BY plans.id
      ORDER BY plans.id;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


// POST /stock/batch
async function insertStockBatch(req, res) {
  const { planId, codes } = req.body;

  if (!planId || !Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    const values = codes.map(code => `(${planId}, '${code}', 'ready')`).join(",");
    const query = `
      INSERT INTO stock (plan_id, code, status)
      VALUES ${values}
      RETURNING id;
    `;

    const result = await db.query(query);

    res.json({ inserted: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getSoldStock,
  insertStockBatch,
};
