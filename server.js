import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

/* =========================
   CREATIVE COMMONS SEARCH
========================= */
app.get("/api/cc-search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query" });

  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

  const response = await fetch(url);
  const data = await response.json();

  res.json(data);
});

/* =========================
   FILE CONVERTER
========================= */
app.post("/api/convert", upload.single("file"), (req, res) => {
  const format = req.body.format;
  const inputPath = req.file.path;
  const outputPath = `${inputPath}.${format}`;

  exec(`ffmpeg -i ${inputPath} ${outputPath}`, err => {
    if (err) return res.status(500).send("Conversion failed");

    res.download(outputPath, () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
});

/* =========================
   ATTRIBUTION GENERATOR
========================= */
app.post("/api/attribution", (req, res) => {
  const { author, source, license } = req.body;
  const text = `Media by ${author} via ${source}, licensed under ${license}`;
  res.json({ attribution: text });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
