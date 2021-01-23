import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendResponse } from '../../../utils/api'
import { getSearchSuggestions } from '../../../utils/data-layer'

export default async function searchSuggestions(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const { query: { searchTerm } } = request
  return sendResponse(response, await getSearchSuggestions(request, searchTerm as string), getRequestLogData(request))
}
