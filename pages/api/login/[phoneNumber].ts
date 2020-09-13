import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendJson, sendUnauthorizedResponse } from '../../../utils/api'
import { adminPhoneNumber, authPassword, authPrefix, getPagesCollection } from '../../../utils/firestore'
import { encrypt } from '../../../utils/crypt'

export default async function phoneNumber(request: NextApiRequest, response: NextApiResponse) {
  let { query } = request
  const phoneNumber = (query.phoneNumber as string).replace(/[-+]/g, '')
  const logData = { phoneNumber, ...getRequestLogData(request) }
  if (phoneNumber.length < 9) {
    sendUnauthorizedResponse(response, 'Login phone number is too short', logData)
    return
  }

  if (phoneNumber === adminPhoneNumber()) {
    sendJson(response, { auth: authPrefix + encrypt(phoneNumber, authPassword), authTitle: 'מנהל מערכת' }, 'Admin login request succeeded', logData)
    return
  }

  const match = (await getPagesCollection().get()).docs.find(
    doc => doc.data().html.replace(/[-+]/g, '').includes(phoneNumber))
  if (match) {
    sendJson(response, { auth: authPrefix + encrypt(phoneNumber, authPassword), authTitle: match.data().title }, 'Login request succeeded', logData)
  } else {
    sendUnauthorizedResponse(response, 'Failed to login', logData)
  }
}
