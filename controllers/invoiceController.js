const db = require("../db");

// GET /invoice/client/:id
async function getClientInvoices(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT * FROM invoices
      WHERE client_id = $1
      ORDER BY created_at DESC
      LIMIT 50;
      `,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getClientInvoices,
};
