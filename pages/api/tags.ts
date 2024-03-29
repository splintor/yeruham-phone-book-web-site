import { NextApiRequest, NextApiResponse } from 'next'
import { sendResponse } from '../../utils/api'
import { getAllTags } from '../../utils/data-layer'

export default async function tags(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  return sendResponse(response, await getAllTags(request))
}
