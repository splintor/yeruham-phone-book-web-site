import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendJson, sendUnauthorizedResponse } from '../../../utils/api'
import {
  adminPhoneNumber,
  authPassword,
  authPrefix,
  findByPhone,
  removePhoneDelimiters
} from '../../../utils/firestore'
import { encrypt } from '../../../utils/crypt'

// noinspection JSUnusedGlobalSymbols
export default async function phoneNumber(request: NextApiRequest, response: NextApiResponse) {
  let { query } = request
  const phoneNumber = removePhoneDelimiters(query.phoneNumber as string)
  const logData = { phoneNumber, ...getRequestLogData(request) }

  if (phoneNumber === adminPhoneNumber()) {
    sendJson(response, { auth: authPrefix + encrypt(phoneNumber, authPassword), authTitle: 'מנהל מערכת' }, 'Admin login request succeeded', logData)
    return
  }

  if (phoneNumber.length < 9) {
    sendUnauthorizedResponse(response, 'Login phone number is too short', logData)
    return
  }

  const match = findByPhone(phoneNumber, request)
  if (match) {
    sendJson(response, { auth: authPrefix + encrypt(phoneNumber, authPassword), authTitle: match.title }, 'Login request succeeded', logData)
  } else {
    sendUnauthorizedResponse(response, 'Failed to login', logData)
  }
}
