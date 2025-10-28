const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (body) => {
  const phone = body.phone;
  const password = body.password;
  const name = body.name;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await db.query(`INSERT INTO Client (name, phone, password)
                VALUES
                ('${name}', '${phone}', '${hashedPassword}');`);

  if (result.rowCount === 1) {
    return true;
  } else {
    return false;
  }
};

const login = async (phone, password) => {
  const result = await db.query(`select * from client where phone = '${phone}'`);
  if (result.rowCount !== 1) {
    return { success: false, message: "user not found!" };
  }

  const user = result.rows[0];
  const hashedPassword = user.password;
  const isPassValid = await bcrypt.compare(password, hashedPassword);
  if (!isPassValid) {
    return { success: false, message: "لاتصير لوتي" };
  }

  const token = jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      name: user.name,
    },
    process.env.SECRET_KEY
  );
  
  return { success: true, token: token };
};



// POST /client/:id/topup
async function topupClient(req, res) {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    // احضار الرصيد القديم
    const oldBalanceQuery = await db.query(
      "SELECT wallet_balance FROM clients WHERE id = $1",
      [id]
    );

    if (oldBalanceQuery.rowCount === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    const oldBalance = Number(oldBalanceQuery.rows[0].wallet_balance);

    // تحديث الرصيد
    const newBalance = oldBalance + Number(amount);
    await db.query(
      "UPDATE clients SET wallet_balance = $1 WHERE id = $2",
      [newBalance, id]
    );

    // إعادة النتيجة
    res.json({
      id,
      oldBalance,
      newBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  register,
  login,
  topupClient,
};
