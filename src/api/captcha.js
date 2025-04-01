// src/api/captcha.js
import axios from "axios";

export const captchaApi = {
  /**
   * 获取验证码
   * @returns {Promise} 包含验证码URL和key的对象
   */
  getCaptcha: () => {
    return axios({
      url: "/api/captcha",
      method: "get",
      responseType: "blob",
    }).then((response) => {
      // 从响应头获取验证码key
      const captchaKey = response.headers["captcha-key"];

      // 如果没有获取到key，抛出错误
      if (!captchaKey) {
        throw new Error("Failed to get captcha key");
      }

      // 创建图片URL
      const blob = new Blob([response.data], { type: "image/jpeg" });
      const captchaUrl = URL.createObjectURL(blob);

      return {
        captchaUrl,
        captchaKey,
      };
    });
  },
};

export default captchaApi;
