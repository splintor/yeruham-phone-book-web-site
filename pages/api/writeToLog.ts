import { NextApiRequest, NextApiResponse } from 'next'
// import { sendResponse, sendUnsupportedMethodResponse } from '../../utils/api'
// import { sendToLog } from '../../utils/data-layer'

export default async function writeToLog(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  response.setHeader("Content-Type", "text/xml")
  response.write(request.method)
  response.end()
  // switch (request.method) {
  //   case 'POST':
  //     return sendResponse(response, await sendToLog(request))
  //
  //   default:
  //     sendUnsupportedMethodResponse(response)
  // }
}
