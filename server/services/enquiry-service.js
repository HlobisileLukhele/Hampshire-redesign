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

async function reserveEnquiryFingerprint(fingerprint, windowMinutes) {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      "DELETE FROM enquiry_deduplication WHERE expires_at < CURRENT_TIMESTAMP(3) LIMIT 100"
    );

    const [existing] = await connection.execute(
      `SELECT expires_at > CURRENT_TIMESTAMP(3) AS is_active
       FROM enquiry_deduplication
       WHERE fingerprint = ?
       FOR UPDATE`,
      [fingerprint]
    );

    if (existing[0]?.is_active) {
      await connection.commit();
      return false;
    }

    if (existing.length) {
      await connection.execute(
        "UPDATE enquiry_deduplication SET expires_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? MINUTE) WHERE fingerprint = ?",
        [windowMinutes, fingerprint]
      );
    } else {
      await connection.execute(
        "INSERT INTO enquiry_deduplication (fingerprint, expires_at) VALUES (?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? MINUTE))",
        [fingerprint, windowMinutes]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function releaseEnquiryFingerprint(fingerprint) {
  await pool.execute("DELETE FROM enquiry_deduplication WHERE fingerprint = ?", [fingerprint]);
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

module.exports = {
  createEnquiry,
  releaseEnquiryFingerprint,
  reserveEnquiryFingerprint,
  updateEnquiryStatus
};
