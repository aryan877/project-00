USE SnippetVault;

CREATE TABLE snippets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  code_language VARCHAR(255),
  stdin TEXT,
  source_code TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
