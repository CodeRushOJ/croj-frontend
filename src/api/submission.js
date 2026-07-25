import request from './request'

const STATUS_BY_CODE = {
  0: 'PENDING',
  1: 'ACCEPTED',
  2: 'COMPILE_ERROR',
  3: 'WRONG_ANSWER',
  4: 'TIME_LIMIT_EXCEEDED',
  5: 'MEMORY_LIMIT_EXCEEDED',
  6: 'RUNTIME_ERROR',
  7: 'SYSTEM_ERROR',
}

const normalizeSubmission = submission => {
  if (!submission) return submission
  const statusCode = typeof submission.status === 'number' ? submission.status : null
  return {
    ...submission,
    statusCode,
    status: statusCode === null ? submission.status : (STATUS_BY_CODE[statusCode] || 'UNKNOWN'),
    time: submission.time ?? submission.runTime,
    message: submission.message ?? submission.errorMessage,
  }
}

const normalizeDetailResponse = response => ({
  ...response,
  data: normalizeSubmission(response.data),
})

const normalizeListResponse = response => ({
  ...response,
  data: response.data ? {
    ...response.data,
    records: (response.data.records || []).map(normalizeSubmission),
  } : response.data,
})

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
    }).then(normalizeListResponse)
  },

  /** 获取单条提交及其最新判题状态。 */
  getSubmission(id) {
    return request({
      url: `/submission/${id}`,
      method: 'get'
    }).then(normalizeDetailResponse)
  }
};

export default submissionApi;
