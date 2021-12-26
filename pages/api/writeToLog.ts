import { NextApiRequest, NextApiResponse } from 'next'
import { parseAuthCookies } from '../../utils/cookies'
// import { sendResponse, sendUnsupportedMethodResponse } from '../../utils/api'
// import { sendToLog } from '../../utils/data-layer'

export default async function writeToLog(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.write(JSON.stringify({ auth: parseAuthCookies(request).auth, body: JSON.stringify(request.body) }))
  response.end()
  // switch (request.method) {
  //   case 'POST':
  //     return sendResponse(response, await sendToLog(request))
  //
  //   default:
  //     sendUnsupportedMethodResponse(response)
  // }
}
