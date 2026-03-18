const express = require("express");
const path    = require("path");
const app     = express();

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");

// Serve static assets
app.use(express.static(DIST));

// All routes fall back to index.html (React Router support)
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`);
});