const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const logger = morgan("tiny");
const multer = require("multer");

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

app.post("/api/get_access_token", async (req, res) => {
  try {
    const { appId, secret } = req.body;

    if (!appId) {
      return res.status(400).send({
        code: 1,
        message: "Missing required parameter: appId",
      });
    }

    const apiUrl = "https://api.weixin.qq.com/cgi-bin/token";
    const params = {
      grant_type: "client_credential",
      appid: appId,
    };

    if (secret) {
      params.secret = secret;
    }

    const response = await axios.post(apiUrl, {}, { params });

    res.send({
      code: 0,
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    res.status(500).send({
      code: 1,
      message: "Failed to fetch access token",
    });
  }
});

app.post("/api/v2/add_draft", async (req, res) => {
  try {
    const { access_token } = req.query;
    console.log("....", access_token)

    if (!access_token) {
      return res.status(400).send({
        code: 1,
        message: "Missing required parameter: access_token",
      });
    }

    const apiUrl = "https://api.weixin.qq.com/cgi-bin/draft/add";
    const body = {
      articles: [
        {
            "title": "经济担忧影响新西兰房价预期",
            "author": "More",
            "digest": "ASB调查显示，尽管利率下降预期创纪录，但房价上涨信心减弱，仅8%认为适合购房。经济不确定性仍是关键因素。",
            "content": "根据ASB最新的",
            "content_source_url": "",
            "thumb_media_id": "mWe_h8mHCnSqW6BZ95WTHVbb_92FEoSnTzi66yPS3XBQq8asI4KlpsrYUHXrrXX3",
            "need_open_comment": 0,
            "only_fans_can_comment": 0
        }
      ],
    }
    const params = {
      access_token: access_token,
    };

    // Sending POST request
    const response = await axios.post(apiUrl, body, { params });
    console.log("Response:", response.data);

    res.send({
      code: 0,
      data: response.data, // Return the response from the API
    });
  } catch (error) {
    res.status(500).send({
      code: 1,
      message: "Failed to add draft",
    });
  }
});

const upload = multer({ dest: "uploads/" }); // Temporary directory for uploads

app.post("/api/add_media", upload.single("file"), async (req, res) => {
  try {
    const { access_token, type } = req.body;
    console.log("Access Token:", access_token);

    if (!access_token) {
      return res.status(400).send({
        code: 1,
        message: "Missing required parameter: access_token",
      });
    }

    if (!req.file) {
      return res.status(400).send({
        code: 1,
        message: "Missing required media file.",
      });
    }

    const apiUrl = "https://api.weixin.qq.com/cgi-bin/material/add_material";
    const params = {
      access_token: access_token,
      type: type,
    };

    // Prepare form-data
    const form = new FormData();
    form.append("media", fs.createReadStream(req.file.path), {
      filename: req.file.originalname, // Original file name
      contentType: req.file.mimetype, // Preserved MIME type
    });

    // Send request to the WeChat API
    const response = await axios.post(apiUrl, form, {
      params, // Query parameters
      headers: form.getHeaders(), // Proper headers for form-data
    });

    // Cleanup the uploaded file
    fs.unlinkSync(req.file.path);

    res.send({
      code: 0,
      data: response.data, // Response from the WeChat API
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send({
      code: 1,
      message: "Failed to add media",
    });
  }
});

app.post("/api/list_media", async (req, res) => {
  try {
    const { appId } = req.body;

    if (!appId) {
      return res.status(400).send({
        code: 1,
        message: "Missing required parameter: appId",
      });
    }

    const apiUrl = "https://api.weixin.qq.com/cgi-bin/material/batchget_material";
    const params = {
      "type":"image",
      "offset":0,
      "count":10,
      appid: appId,
    };

    // Sending POST request
    const response = await axios.post(apiUrl, {}, { params });
    console.log("Response:", response.data);
    
    res.send({
      code: 0,
      data: response.data,
    });
  } catch (error) {
    res.status(500).send({
      code: 1,
      message: "Failed to list",
    });
  }
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
