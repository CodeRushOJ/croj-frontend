import request from './request'

export const contestApi = {
  list: (params) => request({ url: '/v1/contests', method: 'get', params }),
  detail: (contestId) => request({ url: `/v1/contests/${contestId}`, method: 'get' }),
  registration: (contestId) => request({ url: `/v1/contests/${contestId}/me`, method: 'get' }),
  register: (contestId) => request({ url: `/v1/contests/${contestId}/registrations`, method: 'post' }),
  cancelRegistration: (contestId) => request({ url: `/v1/contests/${contestId}/registrations/me`, method: 'delete' }),
  problems: (contestId) => request({ url: `/v1/contests/${contestId}/problems`, method: 'get' }),
  scoreboard: (contestId) => request({ url: `/v1/contests/${contestId}/scoreboard`, method: 'get' }),
}
