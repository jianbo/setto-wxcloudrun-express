const axios = require("axios");

const getToken = async () => {
    try {
        const apiUrl = "https://api.weixin.qq.com/cgi-bin/token";
        const params = {
          grant_type: "client_credential",
          appid: "wx695a65008cff4199",
        //   secret: "f868af7b7d81c69022d24fb1205a08fd"
        };
    
        // Sending POST request
        const response = await axios.post(apiUrl, {}, { params });
    
        console.log('111', response)

      } catch (error) {
        console.error("Error fetching access token:", error.message);
        console.log('222', error)
        // res.status(500).send({
        //   code: 1,
        //   message: "Failed to fetch access token",
        // });
      }
}

getToken();