const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/clientController");

router.post("/register", async (req, res) => {
  try {
    const body = req.body;
    const isSaved = await register(body);
    if (!isSaved) {
      return res.status(501).send({ message: "اكو مشكله بالدنيا..." });
    }
    res.send({ message: "Register succefully." });
  } catch (error) {
    res.status(500).send({ message: "اكو مشكله بالدنيا..." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = req.body;
    const result = await login(body.phone, body.password);
    if (!result.success) {
      return res.status(501).send({ message: result.message });
    }
    res.send({ token: result.token });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "اكو مشكله بالدنيا..." });
  }
});


// (1)GET /client/:id/balance
router.get("/client/:id/balance", async (req, res) => {
  try {
    const clientId = req.params.id;

    // التحقق من ان id رقم
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    // جلب بيانات العميل
    const [clientRows] = await db.query(
      "SELECT id, name FROM clients WHERE id = ?",
      [clientId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const client = clientRows[0];

    // حساب الرصيد من جدول العمليات
    const [balanceRows] = await db.query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS balance
       FROM transactions
       WHERE client_id = ?`,
      [clientId]
    );

    const balance = balanceRows[0].balance;

    return res.json({
      id: client.id,
      name: client.name,
      balance: balance
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;
