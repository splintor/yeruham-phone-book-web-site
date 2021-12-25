import { NextApiRequest, NextApiResponse } from 'next'
import { sendResponse, sendUnsupportedMethodResponse } from '../../utils/api'
import { sendToLog } from '../../utils/data-layer'

export default async function log(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  switch (request.method) {
    case 'POST':
      return sendResponse(response, await sendToLog(request))

    default:
      sendUnsupportedMethodResponse(response)
  }
}
