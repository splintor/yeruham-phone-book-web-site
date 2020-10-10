import { response, ok, created, badRequest, notFound, serverError } from 'wix-http-functions'
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
const suppressAuthAndHooks = { suppressAuth: true, suppressHooks: true }

let phones
let tagsList

async function loadPhonesMapAndTagsList() {
  const phonesMap = new Map()
  const tagsSet = new Set()
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

      page.tags && page.tags.forEach(tagsSet.add, tagsSet)
    })
    result = result.hasNext() && await result.next()
  }
  phones = phonesMap
  tagsList = [...tagsSet]
}

// URL: https://<wix-site-url>/_functions/login/<phoneNumber>
export async function get_login(request) {
  const phoneNumber = request.path[0]

  if (phoneNumber === adminPhoneNumber) {
    return okResponse({ auth: buildAuth(phoneNumber), authTitle: 'מנהל מערכת' })
  }

  if (!phones) {
    await loadPhonesMapAndTagsList()
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
      return okResponse({ phoneNumber })
    }

    if (requireAdmin) {
      return unauthorizedResponse(`Admin request done by non-admin: ${phoneNumber}`)
    }

    if (!phones) {
      await loadPhonesMapAndTagsList()
    }

    const strippedPhoneNumber = removePhoneDelimiters(phoneNumber)
    if (!phones.has(strippedPhoneNumber)) {
      return unauthorizedResponse(`Auth phone not found: ${strippedPhoneNumber}`)
    }

    return okResponse({ phoneNumber: strippedPhoneNumber })
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
    ok({ headers, body: { ...item } }) :
    notFound({ headers, body: { title: titleToSearch, error: `'${param}' was not found` } })
}

export async function post_page(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const { page } = await request.body.json()
  const { phoneNumber } = loginCheck.body
  const conflicts = await wixData.query('pages').eq('title', page.title).ne('_id', page._id).find()
  if (conflicts.items.length > 0) {
    return response({ headers, status: 409, body: { message: `Page with title ${page.title} already exists.` } })
  }

  if (page._id) {
    const [existing] = (await wixData.query('pages').eq('_id', page._id).find()).items
    if (page.title === existing.title && page.html === existing.html && (page.tags || []).join() === (existing.tags || []).join()) {
      return ok({ headers, body: { message: `No change was needed in page ${page.title}.` } });
    }

    await wixData.save('pages_history', { pageId: existing._id, changedBy: phoneNumber, oldTitle: existing.title, oldHtml: existing.html, oldTags: existing.tags }, suppressAuthAndHooks)
  } else {
    page.createdBy = phoneNumber
  }

  await wixData.save('pages', page, suppressAuthAndHooks)
  await loadPhonesMapAndTagsList()

  return page._id ?
    ok({ headers, body: { message: `Page ${page.title} was updated` } }) :
    created({ headers, body: { message: `Page ${page.title} was created` } });
}

// URL: https://<wix-site-url>/_functions/search/<search>
export async function get_search(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  if (!tagsList) {
    await loadPhonesMapAndTagsList()
  }

  const param = decodeURI(request.path[0])
  const searchWords = param.replace(/_/g, ' ').split(/\s+/)
  const [first, ...rest] = searchWords
  let query = wixData.query('pages').contains('title', first).or(wixData.query('pages').contains('html', first))
  rest.forEach(t => query = query.and(wixData.query('pages').contains('title', t).or(wixData.query('pages').contains('html', t))))
  const { items, totalCount } = await query.find()
  const tags = tagsList.filter(t => searchWords.every(w => t.includes(w)))
  return ok({ headers, body: { pages: items, totalCount, tags } })
}

// URL: https://<wix-site-url>/_functions/tag/<tag>
export async function get_tag(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const searchedTag = decodeURI(request.path[0]).replace(/_/g, ' ').replace(/"/g, '')
  const { items } = await wixData.query('pages').contains('tags', searchedTag).limit(1000).find()
  return ok({ headers, body: { pages: items } })
}

// URL: https://<wix-site-url>/_functions/tags
export async function get_tags(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  if (!tagsList) {
    await loadPhonesMapAndTagsList()
  }


  const searchedTag = decodeURI(request.path[0]).replace(/_/g, ' ').replace(/"/g, '')
  const { items } = await wixData.query('pages').contains('tags', searchedTag).limit(1000).find()
  return ok({ headers, body: { tags: tagsList } })
}
