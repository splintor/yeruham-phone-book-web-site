import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendResponse } from '../../../utils/api'
import { login } from '../../../utils/data-layer'

// noinspection JSUnusedGlobalSymbols
export default async function phoneNumber(request: NextApiRequest, response: NextApiResponse) {
  return sendResponse(response, await login(request?.query?.phoneNumber as string || ''), getRequestLogData(request))
}
