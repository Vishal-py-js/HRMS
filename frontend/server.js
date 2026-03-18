import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, "dist");

app.use(express.static(DIST));

app.get("*", (req, res) => {
  res.sendFile(join(DIST, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend running on port ${PORT}`);
});