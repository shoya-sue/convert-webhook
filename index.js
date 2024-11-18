import express from "express";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// JSONリクエストボディを解析
app.use(express.json());

// リクエストデータをjsonファイルに保存するエンドポイント
app.post("/save", async (req, res) => {
  const data = req.body;
  const filePath = path.join("data", `request-${Date.now()}.json`);
  
  try {
    // ディレクトリが存在しない場合は作成
    await fs.mkdir("data", { recursive: true });
    // JSONファイルとして保存
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    res.status(201).send({ message: "Data saved", filePath });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to save data" });
  }
});

// リクエストデータをテンプレートで変換してDiscord Webhookに送信するエンドポイント
app.post("/convert-and-send", async (req, res) => {
  const data = req.body;

  try {
    // テンプレート読み込み
    const templatePath = path.join("templates", "message.tpl");
    const template = await fs.readFile(templatePath, "utf-8");

    // テンプレートを適用
    const message = template.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()] || "");

    // Discord Webhookに送信
    const response = await axios.post(WEBHOOK_URL, { content: message });

    res.status(200).send({ message: "Message sent", discordResponse: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to process request", details: error.message });
  }
});

// サーバを起動
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
