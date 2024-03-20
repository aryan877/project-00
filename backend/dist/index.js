"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mysql2_1 = __importDefault(require("mysql2"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ioredis_1 = __importDefault(require("ioredis"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
const db = mysql2_1.default.createPool({
    uri: process.env.DB_URI,
    connectTimeout: 10000,
});
const redisClient = new ioredis_1.default(process.env.REDIS_URI);
app.post("/api/snippets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, codeLanguage, stdin, sourceCode } = req.body;
    const query = `INSERT INTO snippets (username, code_language, stdin, source_code) VALUES (?, ?, ?, ?)`;
    db.query(query, [username, codeLanguage, stdin, sourceCode], (err, result) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.error("Error adding snippet:", err);
            res.status(500).json({ message: "Failed to add snippet" });
            return;
        }
        const insertId = result.insertId;
        const newSnippet = {
            id: insertId,
            username,
            code_language: codeLanguage,
            stdin,
            source_code: sourceCode,
            timestamp: new Date().toISOString(),
        };
        try {
            const cachedData = yield redisClient.get("snippets");
            const snippets = cachedData ? JSON.parse(cachedData) : [];
            snippets.push(newSnippet);
            yield redisClient.set("snippets", JSON.stringify(snippets), "EX", 3600);
            res.json({ message: "Snippet added successfully", id: insertId });
        }
        catch (cacheErr) {
            console.error("Error updating cache:", cacheErr);
            res.status(500).json({ message: "Failed to update cache" });
        }
    }));
}));
app.get("/api/snippets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cachedData = yield redisClient.get("snippets");
        if (cachedData) {
            res.json(JSON.parse(cachedData));
            return;
        }
        const query = "SELECT id, username, code_language, stdin, SUBSTRING(source_code, 1, 100) AS source_code, timestamp FROM snippets";
        db.query(query, (dbErr, results) => {
            if (dbErr) {
                console.error("Error fetching snippets:", dbErr);
                res.status(500).json({ message: "Failed to fetch snippets" });
            }
            else {
                redisClient.set("snippets", JSON.stringify(results), "EX", 3600);
                res.json(results);
            }
        });
    }
    catch (err) {
        console.error("Redis get error:", err);
        res.status(500).json({ message: "Failed to fetch snippets from cache" });
    }
}));
app.delete("/api/snippets/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const query = "DELETE FROM snippets WHERE id = ?";
    db.query(query, [id], (err, result) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.error("Error deleting snippet:", err);
            res.status(500).json({ message: "Failed to delete snippet" });
        }
        else {
            try {
                const cachedData = yield redisClient.get("snippets");
                let snippets = cachedData ? JSON.parse(cachedData) : [];
                snippets = snippets.filter((snippet) => snippet.id !== parseInt(id));
                yield redisClient.set("snippets", JSON.stringify(snippets), "EX", 3600);
                res.json({ message: "Snippet deleted successfully" });
            }
            catch (cacheErr) {
                console.error("Error updating cache:", cacheErr);
                res.json({ message: "Snippet deleted successfully" });
            }
        }
    }));
}));
app.post("/api/submitCode", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { source_code, language_id, stdin } = req.body;
    try {
        const response = yield axios_1.default.post("https://judge0-ce.p.rapidapi.com/submissions", {
            source_code,
            language_id,
            stdin,
        }, {
            params: {
                base64_encoded: "false",
                fields: "*",
            },
            headers: {
                "content-type": "application/json",
                "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
        });
        res.json({ token: response.data.token });
    }
    catch (error) {
        console.error("Error submitting code to Judge0:", error);
        res.status(500).json({ message: "Failed to submit code" });
    }
}));
app.get("/api/checkResult/:token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    try {
        const response = yield axios_1.default.get(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
            params: {
                base64_encoded: "false",
                fields: "*",
            },
            headers: {
                "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
        });
        res.json(response.data);
    }
    catch (error) {
        console.error("Error checking result from Judge0:", error);
        res.status(500).json({ message: "Failed to check result" });
    }
}));
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
//# sourceMappingURL=index.js.map