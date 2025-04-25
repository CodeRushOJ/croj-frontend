import request from './request'

export const submissionApi = {
  /**
   * 提交代码
   * @param {SubmissionDTO} data
   * @returns {Promise<ResultLong>}
   */
  submitCode(data) {
    return request({
      url: '/submission',
      method: 'post',
      data
    })
  },

  /**
   * 获取提交列表
   * @param {SubmissionQueryDTO} data
   * @returns {Promise<ResultIPageSubmissionVO>}
   */
  getSubmissionList(data) {
    return request({
      url: '/submission/list',
      method: 'post',
      data
    })
  }
};

export default submissionApi;
