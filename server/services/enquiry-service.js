const { pool } = require("../db/pool");

async function createEnquiry(enquiry) {
  const [result] = await pool.execute(
    `INSERT INTO enquiries (name, email, phone, subject, message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      enquiry.name,
      enquiry.email,
      enquiry.phone || null,
      enquiry.subject || null,
      enquiry.message
    ]
  );

  return result.insertId;
}

module.exports = { createEnquiry };
