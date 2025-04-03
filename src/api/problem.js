// src/api/problem.js
import request from "./request";

export const problemApi = {
  /**
   * Get problem list with pagination and filters
   * @param {Object} params - Query params including current, size, keyword, difficulty, status, tagIds
   * @returns {Promise} Promise with problem list data
   */
  getProblemList: (params) => {
    return request({
      url: "/problem/list",
      method: "post",
      data: params,
    });
  },

  /**
   * Get problem details by problem number
   * @param {string} problemNo - Problem number
   * @returns {Promise} Promise with problem details
   */
  getProblemByNo: (problemNo) => {
    return request({
      url: `/problem/no/${problemNo}`,
      method: "get",
    });
  },

  /**
   * Get problem details by ID
   * @param {number} id - Problem ID
   * @returns {Promise} Promise with problem details
   */
  getProblemById: (id) => {
    return request({
      url: `/problem/${id}`,
      method: "get",
    });
  },

  /**
   * Create a new problem
   * @param {Object} problemData - Problem creation data
   * @returns {Promise} Promise with created problem ID
   */
  createProblem: (problemData) => {
    return request({
      url: "/problem",
      method: "post",
      data: problemData,
    });
  },

  /**
   * Update an existing problem
   * @param {Object} problemData - Problem update data
   * @returns {Promise} Promise with update result
   */
  updateProblem: (problemData) => {
    return request({
      url: "/problem",
      method: "put",
      data: problemData,
    });
  },

  /**
   * Delete a problem
   * @param {number} id - Problem ID
   * @returns {Promise} Promise with deletion result
   */
  deleteProblem: (id) => {
    return request({
      url: `/problem/${id}`,
      method: "delete",
    });
  },
};

export default problemApi;
