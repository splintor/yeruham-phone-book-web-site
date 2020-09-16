import { parse } from 'cookie'
import * as admin from 'firebase-admin'
import * as fs from 'fs'
import { IncomingMessage } from 'http'
import cache from 'memory-cache'
import { PageData } from '../types/PageData'
import { getRequestLogData } from './api'
import { decrypt, getKeyFromPassword } from './crypt'
type QuerySnapshot<T> = admin.firestore.QuerySnapshot<T>

const serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT, 'base64').toString())
const getAllPages = () => getFromCache<PageData[]>('pages', [])
const getPagesByTitle = () => getFromCache('pagesByTitle', new Map<string, PageData>())
const getPhones = () => getFromCache('phones', new Map<string, PageData>())
export const removePhoneDelimiters = (s: string) => s.replace(/[+\-.]+/g, '')

function initFirestore() {
  console.log('admin.apps.length', admin.apps.length)
  if (!admin.apps.length) {
    console.info('firestore initializeApp', serviceAccount)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://yeruham-phone-book.firebaseio.com"
    })
  }
}

function getFromCache<T>(key: string, defaultValue: T): T {
  return cache.get(key) as T || defaultValue
  // const result = cache.get(key) as T
  // if (result) {
  //   return result
  // }
  //
  // console.error(`key ${key} is missing in cache. Trying to reload...`)
  // try {
  //   loadData()
  // } catch(e) {
  //   console.log('Failed to load data', e)
  // }
  //
  // return defaultValue
}

function loadData() {
  initFirestore()
  console.debug('getting data...')
  admin.firestore().collection('pages').get().then((data: QuerySnapshot<PageData>) => {
    console.debug('got data', data.docs?.length)
    const pages = data.docs.map(page => ({ id: page.id, updateDate: page.updateTime.toDate().toISOString(), ...page.data() }))
    cache.put('pages', pages)

    console.debug('parsing titles')
    const pagesByTitle = new Map(pages.map(page => [page.title, page]))
    pages.forEach(page => {
      const { oldName } = page
      if (!pagesByTitle.has(oldName)) {
        pagesByTitle.set(oldName, page)
      }
    })
    cache.put('pagesByTitle', pagesByTitle)

    console.debug('parsing phones')
    let phoneDuplicates = ''
    const phones = new Map<string, PageData>()
    pages.forEach(page => {
      const matches = removePhoneDelimiters(page.html).match(/[^A-Z_\d=\/:]\d{9,}/g)
      matches?.forEach(match => {
        match = match.substr(1)
        const existing = phones.get(match)
        if (existing) {
          phoneDuplicates += `${match} appears both in ${existing.title} and in ${page.title}\n`
        } else {
          phones.set(match, page)
        }
      })
    })

    cache.put('phones', phones)
    fs.writeFileSync('./phoneDuplicates.txt', phoneDuplicates)
  }).catch(e => {
    console.error('Failed to load firestore data', e)
  })
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

export const authPrefix = 'PHONE '
export const authPassword = getKeyFromPassword(process.env.AUTH_PASSWORD)
export const adminPhoneNumber = () => process.env.ADMIN_PHONE_NUMBER

export function checkLogin(request: IncomingMessage, { requireAdmin }: { requireAdmin?: boolean } = {}): DatabaseResponse<any> {
  const cookieHeader = request.headers['cookie'] || ''
  const { auth } = parse(cookieHeader)
  const logData = { auth, ...getRequestLogData(request) }

  if (!auth || auth.slice(0, authPrefix.length) !== authPrefix) {
    console.error('Invalid authentication header', logData)
    return DatabaseResponse.unauthorized()
  }

  try {
    const phoneNumber = decrypt(auth.slice(authPrefix.length), authPassword)
    if (!phoneNumber) {
      console.error(`Invalid auth header: ${auth}`, logData)
      return DatabaseResponse.unauthorized()
    }

    logData['phoneNumber'] = phoneNumber

    if (phoneNumber === adminPhoneNumber()) {
      console.info('Admin request authentication succeeded', logData)
      return DatabaseResponse.ok(phoneNumber)
    }

    if (requireAdmin) {
      console.error(`Admin request done by non-admin: ${phoneNumber}`, logData)
      return DatabaseResponse.unauthorized()
    }

    if (!getPhones().has(phoneNumber)) {
      console.error(`Auth phone not found: ${phoneNumber}`, logData)
      return DatabaseResponse.unauthorized()
    }

    console.info('Request authentication succeeded', logData)
    return DatabaseResponse.ok(phoneNumber)
  } catch (exception) {
    console.error('Failed to parse authentication header', { exception, ...logData })
    return DatabaseResponse.unauthorized()
  }
}

export function findByPhone(phoneNumber: string): PageData | undefined {
  return getPhones().get(phoneNumber)
}

export function getPage(title: string, request: IncomingMessage): DatabaseResponse<PageData> {
  const loginCheck = checkLogin(request)
  if (loginCheck.fail()) {
    return loginCheck
  }

  const titleToSearch = title.replace(/_/g, ' ')
  const result = getPagesByTitle().get(titleToSearch)

  if (result) {
    console.debug(`Found page '${title}'`, getRequestLogData(request))
    return DatabaseResponse.ok(result)
  } else {
    console.warn(`Page with title '${title}' was not found`, getRequestLogData(request))
    return DatabaseResponse.notFound()
  }
}

export interface PagesFilter {
  search?: string
  tag?: string
  since?: string
}

export interface PagesResponse {
  pages: PageData[]
}

const MaxPagesToReturn = 30

export function getPages({ search, tag, since }: PagesFilter, request: IncomingMessage): DatabaseResponse<PagesResponse> {
  const loginCheck = checkLogin(request, { requireAdmin: !search && !tag })
  if (loginCheck.fail()) {
    return loginCheck
  }

  const sinceDate = since && new Date(since)

  const result = getAllPages().filter(({ tags, updateDate, title, html }) =>
    (!tag || tags?.includes(tag)) &&
    (!sinceDate || new Date(updateDate) >= sinceDate) &&
    (!search || title.includes(search) || html.includes(search)))

  console.debug(`found ${result.length} pages`, getRequestLogData(request))
  return DatabaseResponse.ok({ pages: result.slice(0, MaxPagesToReturn), hasMore: result.length > MaxPagesToReturn })
}
