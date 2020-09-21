import { response, ok, badRequest, notFound, serverError } from 'wix-http-functions'
import wixData from 'wix-data'
import { adminPhoneNumber, authPassword } from './secret'
import { encrypt, decrypt, getKeyFromPassword } from './crypt'

const headers = { 'Content-Type': 'application/json' }
const okResponse = body => ok({ headers, body })
const removePhoneDelimiters = s => s.replace(/[+\-.]+/g, '')
const authPrefix = 'PHONE '
const authKey = getKeyFromPassword(authPassword)
const buildAuth = phoneNumber => authPrefix + encrypt(phoneNumber, authKey)

const unauthorizedResponse = message => response({ headers, status: 401, body: { message } })

let phones

async function loadPhonesMap() {
  const phonesMap = new Map()
  let result = await wixData.query('pages').limit(1000).find()
  while (result) {
    result.items.forEach(page => {
      const matches = page.html.replace(/[+\-.]+/g, '').match(/[^A-Z_\d=\/:]\d{9,}/g)
      matches && matches.forEach(match => {
        match = match.substr(1)
        const existing = phonesMap.get(match)
        if (existing) {
          //phoneDuplicates += `${match} appears both in ${existing.title} and in ${page.title}\n`
        } else {
          phonesMap.set(match, page)
        }
      })
    })
    result = result.hasNext() && await result.next()
  }
  phones = phonesMap
}

// URL: https://<wix-site-url>/_functions/login/<phoneNumber>
export async function get_login(request) {
  const phoneNumber = request.path[0]

  if (phoneNumber === adminPhoneNumber) {
    return okResponse({ auth: buildAuth(phoneNumber), authTitle: 'מנהל מערכת' })
  }

  if (!phones) {
    await loadPhonesMap()
  }

  const strippedPhoneNumber = removePhoneDelimiters(phoneNumber)
  if (!strippedPhoneNumber || strippedPhoneNumber.length < 9) {
    return unauthorizedResponse('Login phone number is too short')
  }

  const foundPage = phones.get(strippedPhoneNumber)
  if (foundPage) {
    return okResponse({ auth: buildAuth(phoneNumber), authTitle: foundPage.title })
  } else {
    return unauthorizedResponse('Failed to login')
  }
}

// URL: https://<wix-site-url>/_functions/checkLogin
export async function get_checkLogin(request, { requireAdmin } = {}) {
  const auth = request.headers['authorization']
  if (!auth || !auth.startsWith(authPrefix)) {
    return unauthorizedResponse('Invalid authentication header')
  }

  try {
    const phoneNumber = decrypt(auth.slice(authPrefix.length), authKey)
    if (!phoneNumber) {
      return unauthorizedResponse(`Invalid auth header: ${auth}`)
    }

    if (phoneNumber === adminPhoneNumber) {
      return ok()
    }

    if (requireAdmin) {
      return unauthorizedResponse(`Admin request done by non-admin: ${phoneNumber}`)
    }

    if (!phones) {
      await loadPhonesMap()
    }

    const strippedPhoneNumber = removePhoneDelimiters(phoneNumber)
    if (!phones.has(strippedPhoneNumber)) {
      return unauthorizedResponse(`Auth phone not found: ${strippedPhoneNumber}`)
    }

    return ok()
  } catch (exception) {
    return unauthorizedResponse('Failed to parse authentication header')
  }
}

// URL: https://<wix-site-url>/_functions/page/<titleOrOldName>
export async function get_page(request) {
  const loginCheck = await get_checkLogin(request)
  const param = decodeURI(request.path[0])
  const titleToSearch = param.replace(/_/g, ' ')
  const result = await wixData.query('pages').eq('title', titleToSearch).or(wixData.query('pages').eq('oldName', param)).find()
  const item = result.items.length === 0 ? null : result.items[0]

  if (loginCheck.status !== 200) {
    return response({ headers, status: loginCheck.status, body: { title: item && item.title || titleToSearch } })
  }

  return item ?
    notFound({ headers, body: { title: titleToSearch, error: `'${param}' was not found` } }) :
    ok({ headers, body: { ...item } })
}

// URL: https://<wix-site-url>/_functions/search/<search>
export async function get_search(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const param = decodeURI(request.path[0])
  const [first, ...rest] = param.replace(/_/g, ' ').split(/\s+/)
  let query = wixData.query('pages').contains('title', first).or(wixData.query('pages').contains('html', first))
  rest.forEach(t => query = query.and(wixData.query('pages').contains('title', t).or(wixData.query('pages').contains('html', t))))
  const { items, totalCount } = await query.limit(50).find()
  return ok({ headers, body: { pages: items, totalCount } })
}

// URL: https://<wix-site-url>/_functions/tag/<tag>
export async function get_tag(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const searchedTag = decodeURI(request.path[0]).replace(/_/g, ' ').replace(/"/g, '')
  console.log('searchedTag', searchedTag)
  const { items } = await wixData.query('pages').contains('tags', searchedTag).limit(1000).find()
  return ok({ headers, body: { pages: items } })
}
