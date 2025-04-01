// src/api/email.js
import request from './request';

export const emailApi = {
  /**
   * 发送邮箱验证码（用于注册）
   * @param {string} email - 邮箱
   * @param {string} username - 用户名
   * @returns {Promise} Promise with the send result
   */
  sendVerificationCode: (email, username) => {
    return request({
      url: '/email/code',
      method: 'post',
      params: { email, username }
    });
  },

  /**
   * 发送邮箱验证链接（用于已注册用户）
   * @returns {Promise} Promise with the send result
   */
  sendVerificationLink: () => {
    return request({
      url: '/email/send-verification',
      method: 'post'
    });
  },

  /**
   * 验证邮箱
   * @param {number} userId - 用户ID
   * @param {string} code - 验证码
   * @returns {Promise} Promise with the verification result
   */
  verifyEmail: (userId, code) => {
    return request({
      url: '/email/verify',
      method: 'get',
      params: { userId, code }
    });
  }
};

export default emailApi;