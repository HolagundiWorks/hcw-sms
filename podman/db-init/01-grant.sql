-- Give the application user enough privileges for the web installer, which
-- can CREATE / DROP the database and creates triggers, procedures and events.
CREATE USER IF NOT EXISTS 'hcwsms'@'%' IDENTIFIED BY 'hcwsms_pw';
GRANT ALL PRIVILEGES ON *.* TO 'hcwsms'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
