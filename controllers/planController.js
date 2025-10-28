const db = require("../db");

const getPlans = async () => {
  const { rows } = await db.query("SELECT * FROM plan");
  return rows;
};

const getPlanById = async (palnId) => {
  const { rows } = await db.query(`SELECT * FROM plan WHERE id = ${palnId}`);
  return rows[0];
};

const purchase = async (planId, clientId) => {
  const stockResult = await db.query(
    `SELECT * FROM stock WHERE plan_id = ${planId} AND state = 'ready'`
  );
  if (stockResult.rows.length == 0) {
    return { success: false, message: "no stock" };
  }

  const clientResults = await db.query(
    `SELECT * FROM client WHERE id = ${clientId}`
  );

  if (clientResults.rows.length == 0) {
    return { success: false, message: "منيلك هاي الكلاوات" };
  }

  const planResult = await db.query(`SELECT * FROM plan WHERE id = ${planId}`);

  let user = clientResults.rows[0];
  let stock = stockResult.rows[0];
  let plan = planResult.rows[0];

  if (user.balance < parseInt(plan.price)) {
    return { success: false, message: "ماعندك فلوس، روح اشتغل وتعال" };
  }

  await db.query(`UPDATE stock SET state = 'sold' WHERE id = ${stock.id}`);
  await db.query(
    `UPDATE client SET balance = ${
      user.balance - plan.price
    } WHERE id = ${clientId}`
  );

  const result = await db.query(
    `INSERT INTO invoice (plan_id, code, client_id, price, plan_name)
    VALUES (${planId}, '${stock.code}', ${clientId}, ${plan.price}, '${plan.name}')
    RETURNING *;`
  );

  const newInvoice = result.rows[0];

  return { success: true, code: stock.code, newInvoice };
};


// GET /plans/:id/stock
async function getPlanStock(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT
        plans.id AS plan_id,
        plans.name AS plan_name,
        COUNT(*) FILTER (WHERE stock.status = 'ready') AS ready,
        COUNT(*) FILTER (WHERE stock.status = 'sold') AS sold,
        COUNT(*) FILTER (WHERE stock.status = 'error') AS error
      FROM plans
      LEFT JOIN stock ON plans.id = stock.plan_id
      WHERE plans.id = $1
      GROUP BY plans.id;
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const row = result.rows[0];
    res.json({
      planId: row.plan_id,
      planName: row.plan_name,
      ready: Number(row.ready),
      sold: Number(row.sold),
      error: Number(row.error),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getPlans,
  getPlanById,
  purchase,
};
