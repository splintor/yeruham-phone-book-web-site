import { NextApiRequest, NextApiResponse } from 'next'
import { sendResponse } from '../../utils/api'
import { getAllPages } from '../../utils/data-layer'

export default async function allPages(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  return sendResponse(response, await getAllPages(request, request.query.UpdatedAfter as string, request.query.RequestedBy as string))
}
