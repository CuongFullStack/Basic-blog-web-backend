const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const user = require("./models/User");
const post = require("./models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");

const app = express();

const salt = bcrypt.genSaltSync(10);
const secret = "adadffddgfdgdgffsdfdsfdsfdsds";

app.use(cors({ credentials: true, origin: "http://localhost:3000" })); ///////
app.use(express.json());
app.use(cookieParser()); //////
app.use("/uploads", express.static(__dirname + "/uploads")); ///Tạo endpoint cho hình ảnh

mongoose.set("strictQuery", false);
///connect DB
(async () => {
  try {
    await mongoose.connect(process.env.URL);
    app.listen(4000);
  } catch (error) {
    console.log(">>> Error connect to DB: ", error);
  }
})();

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await user.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (err) {
    console.log(err);
    res.status(400).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await user.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("wrong credentials");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  console.log(req.file);
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });
    res.json(postDoc);
  });
});

app.get("/post", async (req, res) => {
  const posts = await post
    .find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 }) ///Thứ tự bài đăng
    .limit(20);
  res.json(posts);
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});
