import { parse } from 'cookie'
import * as admin from 'firebase-admin'
import { IncomingMessage } from 'http'
import { getRequestLogData } from './api'
import { decrypt, getKeyFromPassword } from './crypt'
type Query<T> = admin.firestore.Query<T>
type CollectionReference<T> = admin.firestore.CollectionReference<T>
type QueryDocumentSnapshot<T> = admin.firestore.QueryDocumentSnapshot<T>

const serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT, 'base64').toString())

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://yeruham-phone-book.firebaseio.com"
  })
}

export interface PageData {
  title: string
  html: string
  oldUrl?: string
  oldName?: string
}

export interface PageMetaData extends PageData {
  id: string
}

export enum DatabaseStatus {
  OK = 200,
  Unauthorized = 401,
  NotFound = 404,
}

export class DatabaseResponse<T> {
  constructor(public status: DatabaseStatus, public data: T = null) {}

  static ok<T>(data: T) {
    return new DatabaseResponse(DatabaseStatus.OK, data)
  }

  static notFound() {
    return new DatabaseResponse<any>(DatabaseStatus.NotFound)
  }

  static unauthorized() {
    return new DatabaseResponse<any>(DatabaseStatus.Unauthorized)
  }

  fail() {
    return this.status !== DatabaseStatus.OK
  }
}

export const getPagesCollection = () => admin.firestore().collection('pages') as CollectionReference<PageData>
export const authPrefix = 'PHONE '
export const authPassword = getKeyFromPassword(process.env.AUTH_PASSWORD)
export const adminPhoneNumber = () => process.env.ADMIN_PHONE_NUMBER

export const getPageJSON = (page: QueryDocumentSnapshot<PageData>) =>
  ({ id: page.id, updateDate: page.updateTime.toDate().toISOString(), ...page.data() })

export function checkLogin(request: IncomingMessage, { requireAdmin }: { requireAdmin?: boolean } = {}): DatabaseResponse<any> {
  console.log('in checkLogin')
  const cookieHeader = request.headers['cookie'] || ''
  console.log('cookieHeader', cookieHeader);
  const { auth } = parse(cookieHeader)
  console.log('auth', auth);
  const logData = { auth, ...getRequestLogData(request) }

  if (!auth || auth.slice(0, authPrefix.length) !== authPrefix) {
    console.error('Invalid authentication header', logData)
    return DatabaseResponse.unauthorized()
  }

  try {
    const phoneNumber = decrypt(auth.slice(authPrefix.length), authPassword)
    if (phoneNumber && (!requireAdmin || phoneNumber === adminPhoneNumber())) {
      console.info('Request authentication succeeded', { phoneNumber, ...logData })
      return DatabaseResponse.ok(phoneNumber)
    }

    console.error(`Invalid phone number: ${phoneNumber}`, logData)
    return DatabaseResponse.unauthorized()
  } catch (exception) {
    console.error('Failed to parse authentication header', { exception, ...logData})
    return DatabaseResponse.unauthorized()
  }
}

export async function getPage(title: string, request: IncomingMessage): Promise<DatabaseResponse<PageMetaData>> {
  const loginCheck = checkLogin(request)
  if (loginCheck.fail()) {
    return loginCheck
  }

  let result = await getPagesCollection().where('title', '==', title.replace(/_/g, ' ')).limit(1).get()
  if (result.empty) {
    result = await getPagesCollection().where('oldName', '==', title).limit(1).get()
  }

  if (result.empty) {
    console.log(`Page with title '${title}' was not found`, getRequestLogData(request))
    return DatabaseResponse.notFound()
  } else {
    console.log(`Found page '${title}'`, getRequestLogData(request))
    return DatabaseResponse.ok(getPageJSON(result.docs[0]))
  }
}

export interface PagesFilter {
  search?: string
  tag?: string
  since?: string
}

export interface PagesResponse {
  pages: PageMetaData[]
}

export async function getPages({ search, tag, since }: PagesFilter, request: IncomingMessage): Promise<DatabaseResponse<PagesResponse>> {
  const loginCheck = checkLogin(request, { requireAdmin: !search && !tag })
  if (loginCheck.fail()) {
    return loginCheck
  }

  let query: Query<PageData> = getPagesCollection()

  if (tag) {
    query = query.where('tags', 'array-contains', tag)
  }

  let docs = (await query.get()).docs
  if (since) {
    const sinceTimestamp = admin.firestore.Timestamp.fromDate(new Date(since as string))
    docs = docs.filter(d => d.updateTime >= sinceTimestamp)
  }

  if (search && typeof search === 'string') {
    docs = docs.filter(d => {
      const { title, html } = d.data()
      return title.includes(search) || html.includes(search)
    })
  }

  console.log(`found ${docs.length} pages`, getRequestLogData(request))
  return DatabaseResponse.ok({ pages: docs.map(getPageJSON) })
}
