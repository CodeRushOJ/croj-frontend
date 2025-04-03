// src/api/tag.js
import request from "./request";

export const tagApi = {
  /**
   * Get all tags
   * @returns {Promise} Promise with all tags
   */
  getAllTags: () => {
    return request({
      url: "/problem/tag/all",
      method: "get",
    });
  },

  /**
   * Get tag list with pagination
   * @param {Object} params - Query params including current, size, keyword
   * @returns {Promise} Promise with tag list data
   */
  getTagList: (params) => {
    return request({
      url: "/problem/tag/list",
      method: "get",
      params,
    });
  },

  /**
   * Get tag by ID
   * @param {number} id - Tag ID
   * @returns {Promise} Promise with tag details
   */
  getTagById: (id) => {
    return request({
      url: `/problem/tag/${id}`,
      method: "get",
    });
  },

  /**
   * Get tags for a specific problem
   * @param {number} problemId - Problem ID
   * @returns {Promise} Promise with problem tags
   */
  getTagsByProblemId: (problemId) => {
    return request({
      url: `/problem/tag/problem/${problemId}`,
      method: "get",
    });
  },

  /**
   * Create a new tag
   * @param {Object} tagData - Tag creation data
   * @returns {Promise} Promise with created tag ID
   */
  createTag: (tagData) => {
    return request({
      url: "/problem/tag",
      method: "post",
      data: tagData,
    });
  },

  /**
   * Update an existing tag
   * @param {Object} tagData - Tag update data
   * @returns {Promise} Promise with update result
   */
  updateTag: (tagData) => {
    return request({
      url: "/problem/tag",
      method: "put",
      data: tagData,
    });
  },

  /**
   * Delete a tag
   * @param {number} id - Tag ID
   * @returns {Promise} Promise with deletion result
   */
  deleteTag: (id) => {
    return request({
      url: `/problem/tag/${id}`,
      method: "delete",
    });
  },
};

export default tagApi;
