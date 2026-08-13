CREATE TABLE enquiry_deduplication (
  fingerprint CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (fingerprint),
  KEY idx_enquiry_deduplication_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
