const { pool } = require("../db/pool");

async function createEnquiry(enquiry) {
  const [result] = await pool.execute(
    `INSERT INTO enquiries (name, email, phone, subject, message, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
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

async function updateEnquiryStatus(enquiryId, status) {
  const [result] = await pool.execute(
    "UPDATE enquiries SET status = ? WHERE id = ?",
    [status, enquiryId]
  );

  if (result.affectedRows !== 1) {
    throw new Error(`Unable to update status for enquiry ${enquiryId}`);
  }
}

module.exports = { createEnquiry, updateEnquiryStatus };
