const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");
const axios = require("axios");
const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

app.post("/get_access_token", async (req, res) => {
  try {
    const apiUrl = "https://api.weixin.qq.com/cgi-bin/token";
    const params = {
      grant_type: "client_credential",
      appid: "wx695a65008cff4199", // Replace with your appid
    };

    // Sending POST request
    const response = await axios.post(apiUrl, {}, { params });

    res.send({
      code: 0,
      data: response.data, // Return the response from the API
    });
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    res.status(500).send({
      code: 1,
      message: "Failed to fetch access token",
    });
  }
});


// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
