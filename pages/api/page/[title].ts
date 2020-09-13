import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendUnsupportedMethodResponse } from '../../../utils/api'
import { getPage } from '../../../utils/firestore'

export default async function page(request: NextApiRequest, response: NextApiResponse) {
  const { method, query: { title }} = request
  switch (request.method) {
    case 'GET':
      const { status, data } = await getPage(title as string, request)
      response.status(status)
      data && response.json(data)
      break

//    case 'POST':
      // TODO: Allow updating a page
//      break

    default:
      sendUnsupportedMethodResponse(response, `Unexpected method ${method} for page API`, getRequestLogData(request))
  }
}
