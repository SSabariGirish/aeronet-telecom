CREATE DATABASE IF NOT EXISTS aeronet_db;
USE aeronet_db;

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bill_amount DECIMAL(10, 2),
    data_usage VARCHAR(50)
);

INSERT INTO customers (account_number, password_hash, bill_amount, data_usage) VALUES
('AERO-1001', '$2b$12$Q/KA/2YR/weCLlPJMqMlWuYUFfDpik6PtX4wqv3lkJRSp0P/NvdA6', 45.99, '12GB / 50GB'),
('AERO-1002', '$2b$12$YLAbRtZnVzKlppjVk21s..Hz34kyLKGPEcGHaYN1j0db9nDG9o8qm', 0.00, 'Unlimited'),
('AERO-1003', '$2b$12$LUKLOognuRFAHxT3QJF2T.XTS5.X8QonmzMTnB1NcJuMvEK8QrLou', 105.50, '80GB / 100GB');