export const API_CONFIG = {
  BASE_URL: 'https://us-central1-tradestream-cloud.cloudfunctions.net',
  ENDPOINTS: {
    STOPLOSS_OPTIMIZER: '/stoploss-optimizooor',
  },
  PARAMS: {
    UID: 'test_data',
    SESSION_ID: 'ts-scrt-9343',
  },
} as const

export const getStoplossOptimizerUrl = () => {
  const { BASE_URL, ENDPOINTS, PARAMS } = API_CONFIG
  const params = new URLSearchParams({
    uid: PARAMS.UID,
    session_id: PARAMS.SESSION_ID,
  })
  return `${BASE_URL}${ENDPOINTS.STOPLOSS_OPTIMIZER}?${params.toString()}`
}
