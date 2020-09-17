import { NextApiRequest, NextApiResponse } from 'next'
import cache from 'memory-cache'
import * as fs from 'fs'
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
  const cacheKey1 = cache.get('key1') as string
  console.log('cacheKey1', typeof cacheKey1, cacheKey1 || 'N/A')
  cache.put('key1', 1 + Number(cacheKey1 || 0))

  const file1 = fs.readFileSync('./file.txt')
  console.log('file1', typeof file1, file1?.toString() || 'N/A')
  fs.writeFileSync('./file.txt', 'a ' + file1?.toString())

  if (request.env) {
    const env1 = request.env['env1'];
    console.log('env1', typeof env1, env1 || 'N/A')
    request.env['env1'] = 'b ' + (env1 || '')
  } else {
    console.log('request.env is ', typeof request.env)
  }

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
