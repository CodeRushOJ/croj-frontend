import request from './request'

export const contestApi = {
  list: (params) => request({
    url: '/v1/contests',
    method: 'get',
    params,
    anonymousFallback: true,
  }),
  detail: (contestId, { signal } = {}) => request({
    url: `/v1/contests/${contestId}`,
    method: 'get',
    signal,
    anonymousFallback: true,
  }),
  registration: (contestId) => request({ url: `/v1/contests/${contestId}/me`, method: 'get' }),
  register: (contestId) => request({ url: `/v1/contests/${contestId}/registrations`, method: 'post' }),
  cancelRegistration: (contestId) => request({ url: `/v1/contests/${contestId}/registrations/me`, method: 'delete' }),
  problems: (contestId, { signal } = {}) => request({
    url: `/v1/contests/${contestId}/problems`,
    method: 'get',
    signal,
    anonymousFallback: true,
  }),
  scoreboard: (contestId) => request({
    url: `/v1/contests/${contestId}/scoreboard`,
    method: 'get',
    anonymousFallback: true,
  }),
}

export const adminContestApi = {
  create: (data, { signal } = {}) => request({
    url: '/v1/admin/contests',
    method: 'post',
    data,
    signal,
  }),
  update: (contestId, data, { signal } = {}) => request({
    url: `/v1/admin/contests/${contestId}`,
    method: 'put',
    data,
    signal,
  }),
  arrangeProblems: (contestId, problems, { signal } = {}) => request({
    url: `/v1/admin/contests/${contestId}/problems`,
    method: 'put',
    data: { problems },
    signal,
  }),
  publish: (contestId, { signal } = {}) => request({
    url: `/v1/admin/contests/${contestId}/publish`,
    method: 'post',
    signal,
  }),
  cancel: (contestId, { signal } = {}) => request({
    url: `/v1/admin/contests/${contestId}`,
    method: 'delete',
    signal,
  }),
}
