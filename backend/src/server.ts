import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import mysql, { Connection } from "mysql";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const db: Connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// Routes
app.post("/api/snippets", (req: Request, res: Response) => {
  const { username, codeLanguage, stdin, sourceCode } = req.body;
  const query = `INSERT INTO snippets (username, code_language, stdin, source_code) VALUES (?, ?, ?, ?)`;

  db.query(
    query,
    [username, codeLanguage, stdin, sourceCode],
    (err, result) => {
      if (err) throw err;
      res.json({ message: "Snippet added successfully", id: result.insertId });
    }
  );
});

app.get("/api/snippets", (req: Request, res: Response) => {
  const query =
    "SELECT id, username, code_language, stdin, SUBSTRING(source_code, 1, 100) AS source_code, timestamp FROM snippets";

  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
