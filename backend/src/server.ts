import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import mysql, { Pool } from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
const Redis = require("ioredis");
import { ResultSetHeader } from "mysql2";
dotenv.config();
import { Snippet } from "./types/Snippet";
import axios from "axios";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const db: Pool = mysql.createPool({
  uri: process.env.DB_URI,
  connectTimeout: 10000,
});

const redisClient = new Redis(process.env.REDIS_URI);

app.post("/api/snippets", async (req: Request, res: Response) => {
  const { username, codeLanguage, stdin, sourceCode } = req.body;
  const query = `INSERT INTO snippets (username, code_language, stdin, source_code) VALUES (?, ?, ?, ?)`;

  db.query(
    query,
    [username, codeLanguage, stdin, sourceCode],
    async (err, result) => {
      if (err) {
        console.error("Error adding snippet:", err);
        res.status(500).json({ message: "Failed to add snippet" });
        return;
      }
      const insertId = (result as ResultSetHeader).insertId;

      const newSnippet = {
        id: insertId,
        username,
        code_language: codeLanguage,
        stdin,
        source_code: sourceCode,
        timestamp: new Date().toISOString(),
      };

      try {
        const cachedData = await redisClient.get("snippets");
        const snippets = cachedData ? JSON.parse(cachedData) : [];

        snippets.push(newSnippet);

        await redisClient.set("snippets", JSON.stringify(snippets), "EX", 3600);

        res.json({ message: "Snippet added successfully", id: insertId });
      } catch (cacheErr) {
        console.error("Error updating cache:", cacheErr);
        res.status(500).json({ message: "Failed to update cache" });
      }
    }
  );
});

app.get("/api/snippets", async (req: Request, res: Response) => {
  try {
    const cachedData = await redisClient.get("snippets");
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }
    const query =
      "SELECT id, username, code_language, stdin, SUBSTRING(source_code, 1, 100) AS source_code, timestamp FROM snippets";
    db.query(query, (dbErr, results) => {
      if (dbErr) {
        console.error("Error fetching snippets:", dbErr);
        res.status(500).json({ message: "Failed to fetch snippets" });
      } else {
        redisClient.set("snippets", JSON.stringify(results), "EX", 3600);
        res.json(results);
      }
    });
  } catch (err) {
    console.error("Redis get error:", err);
    res.status(500).json({ message: "Failed to fetch snippets from cache" });
  }
});

app.delete("/api/snippets/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const query = "DELETE FROM snippets WHERE id = ?";

  db.query(query, [id], async (err, result) => {
    if (err) {
      console.error("Error deleting snippet:", err);
      res.status(500).json({ message: "Failed to delete snippet" });
    } else {
      try {
        const cachedData = await redisClient.get("snippets");
        let snippets: Snippet[] = cachedData ? JSON.parse(cachedData) : [];

        snippets = snippets.filter((snippet) => snippet.id !== parseInt(id));

        await redisClient.set("snippets", JSON.stringify(snippets), "EX", 3600);

        res.json({ message: "Snippet deleted successfully" });
      } catch (cacheErr) {
        console.error("Error updating cache:", cacheErr);
        res.json({ message: "Snippet deleted successfully" });
      }
    }
  });
});

app.post("/api/submitCode", async (req: Request, res: Response) => {
  const { source_code, language_id, stdin } = req.body;

  try {
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions",
      {
        source_code,
        language_id,
        stdin,
      },
      {
        params: {
          base64_encoded: "false",
          fields: "*",
        },
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    res.json({ token: response.data.token });
  } catch (error) {
    console.error("Error submitting code to Judge0:", error);
    res.status(500).json({ message: "Failed to submit code" });
  }
});

app.get("/api/checkResult/:token", async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const response = await axios.get(
      `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
      {
        params: {
          base64_encoded: "false",
          fields: "*",
        },
        headers: {
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error checking result from Judge0:", error);
    res.status(500).json({ message: "Failed to check result" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
