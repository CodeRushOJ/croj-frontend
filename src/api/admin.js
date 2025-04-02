// src/api/admin.js
import request from "./request";

export const adminApi = {
  /**
   * 获取用户分页列表
   * @param {Object} params - 分页和筛选参数
   * @returns {Promise} 包含用户列表的Promise
   */
  getUsers: (params) => {
    return request({
      url: "/user/list",
      method: "get",
      params,
    });
  },

  /**
   * 根据ID获取用户详情
   * @param {number} id - 用户ID
   * @returns {Promise} 包含用户详情的Promise
   */
  getUserById: (id) => {
    return request({
      url: `/user/${id}`,
      method: "get",
    });
  },

  /**
   * 更新用户状态（启用/禁用）
   * @param {number} id - 用户ID
   * @param {number} status - 状态：0-正常，1-禁用
   * @returns {Promise} 包含更新结果的Promise
   */
  updateUserStatus: (id, status) => {
    return request({
      url: `/user/status/${id}/${status}`,
      method: "put",
    });
  },

  /**
   * 删除用户
   * @param {number} id - 用户ID
   * @returns {Promise} 包含删除结果的Promise
   */
  deleteUser: (id) => {
    return request({
      url: `/user/${id}`,
      method: "delete",
    });
  },

  /**
   * 获取管理统计数据
   * @returns {Promise} 包含统计数据的Promise
   */
  getStatistics: () => {
    return request({
      url: "/admin/statistics",
      method: "get",
    });
  },
};

export default adminApi;
