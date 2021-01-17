import { response, ok, created, notFound, badRequest } from 'wix-http-functions'
import wixData from 'wix-data'
import { fetch } from 'wix-fetch'
import { adminPhoneNumber, authPassword, telegramBotApiToken, telegramChannelChatId } from './secret'
import { encrypt, decrypt, getKeyFromPassword } from './crypt'
import { mappedString } from './hebrewMapping'

const headers = { 'Content-Type': 'application/json' }
const okResponse = body => ok({ headers, body })
const removePhoneDelimiters = s => s.replace(/[+\-.]+/g, '')
const authPrefix = 'PHONE '
const authKey = getKeyFromPassword(authPassword)
const buildAuth = phoneNumber => authPrefix + encrypt(phoneNumber, authKey)

const unauthorizedResponse = message => response({ headers, status: 401, body: { message } })
const suppressAuthAndHooks = { suppressAuth: true, suppressHooks: true }
const siteUrl = 'https://yeruham-phone-book.now.sh/'

let allPages
let maxDate
let activePages
let phones
let tagsList

async function loadCacheData() {
  let pagesList = []
  let result = await wixData.query('pages').limit(1000).find()
  while (result) {
    pagesList = pagesList.concat(result.items)
    result = result.hasNext() && await result.next()
  }

  const phonesMap = new Map()
  const tagsSet = new Set()
  pagesList.forEach(page => {
    const matches = page.html.replace(/[+\-.]+/g, '').match(/[^A-Z_\d=\/:]\d{9,}/g)
    matches && matches.forEach(match => {
      match = match.substr(1)
      const existing = phonesMap.get(match)
      if (!existing) {
        phonesMap.set(match, page)
      }
    })

    page.tags && page.tags.forEach(tagsSet.add, tagsSet)
  })

  allPages = pagesList
  maxDate = allPages.reduce((d, p) => Math.max(p._updatedDate, d), allPages[0]._updatedDate)
  activePages = pagesList.filter(p => !p.isDeleted)
  phones = phonesMap
  tagsList = [...tagsSet]
}

// URL: https://<wix-site-url>/_functions/login/<phoneNumber>
export async function get_login(request) {
  const phoneNumber = request.path[0]

  if (phoneNumber === adminPhoneNumber) {
    return okResponse({ auth: buildAuth(phoneNumber), authTitle: getPhoneTitle(phoneNumber) })
  }

  if (!phones) {
    await loadCacheData()
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

function getPhoneTitle(phoneNumber) {
  if (phoneNumber === adminPhoneNumber) {
    return 'מנהל מערכת'
  }

  const page = phones.get(phoneNumber)
  return page && page.title || phoneNumber
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
      await loadCacheData()
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

  if (!activePages) {
    await loadCacheData()
  }

  const param = decodeURI(request.path[0])
  const titleToSearch = param.replace(/_/g, ' ')
  const [item] = activePages.filter(p => p.title === titleToSearch || p.oldName === param) || []

  return loginCheck.status === 200
    ? item
      ? okResponse(item)
      : notFound({ headers, body: { title: titleToSearch, error: `'${param}' was not found` } })
    : response({ headers, status: loginCheck.status, body: { title: item && item.title || titleToSearch } })
}

const getMargdownLink = title => `[${title}](${siteUrl}${title.replace(/ /g, '_')}?noPreview=1)`

export async function post_page(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const { page } = await request.body.json()
  const { phoneNumber } = loginCheck.body
  const conflicts = await wixData.query('pages').eq('title', page.title).ne('_id', page._id).find()
  const [conflictingItem] = conflicts.items
  if (conflictingItem) {
    if (conflictingItem.isDeleted) {
      page._id = conflictingItem._id
    } else {
      return response({ headers, status: 409, body: { message: `Page with title ${page.title} already exists.` } })
    }
  }

  let updateMessage = getPhoneTitle(phoneNumber) + ' '

  if (page._id) {
    const [existing] = (await wixData.query('pages').eq('_id', page._id).find()).items
    if (page.title === existing.title && page.html === existing.html && page.isDeleted === existing.isDeleted && (page.tags || []).join() === (existing.tags || []).join()) {
      return okResponse({ message: `No change was needed in page ${page.title}.` })
    }

    await wixData.save('pages_history', { pageId: existing._id, changedBy: phoneNumber, oldTitle: existing.title, oldHtml: existing.html, oldTags: existing.tags }, suppressAuthAndHooks)
    if (page.isDeleted) {
      updateMessage = `הדף ${page.title} *נמחק* ע"י ${getPhoneTitle(phoneNumber   )}`
    } else if (existing.isDeleted) {
      updateMessage = `הדף ${getMargdownLink(page.title)} *שוחזר* ע"י ${getPhoneTitle(phoneNumber)}`
    } else {
      updateMessage = `הדף ${getMargdownLink(page.title)} *עודכן* ע"י ${getPhoneTitle(phoneNumber)}`
    }
  } else {
    updateMessage = `הדף ${getMargdownLink(page.title)} *נוצר* ע"י ${getPhoneTitle(phoneNumber)}`
    page.createdBy = phoneNumber
  }

  await wixData.save('pages', page, suppressAuthAndHooks)
  await fetch(`https://api.telegram.org/bot${telegramBotApiToken}/sendMessage?chat_id=${telegramChannelChatId}&parse_mode=Markdown&text=${encodeURIComponent(updateMessage)}`, { method: 'get' })
  loadCacheData()

  return page._id ?
    okResponse({ message: `Page ${page.title} was updated` }) :
    created({ headers, body: { message: `Page ${page.title} was created` } })
}

function parseToWords(s) {
  s = s.trim()
  if (!s) {
    return []
  }

  const pos = s.indexOf('"')
  if (pos === -1 || (pos > 0 && s[pos - 1] !== ' ')) {
    return s.split(' ')
  }

  let nextPos = s.indexOf('"', pos + 1)
  if (nextPos === -1) {
    nextPos = s.length
  }

  return [...parseToWords(s.substring(0, pos)), s.substring(pos + 1, nextPos - pos - 1), ...parseToWords(s.substring(nextPos + 1))]
}

function isPageMatchWord(page, word) {
  if (word.startsWith('##')) {
    const re = new RegExp(word.substring(2))
    return page.title.match(re) || page.html.match(re) || page.html.replace(/-/g, '').match(re)
  }

  return page.title.toLowerCase().includes(word) ||
    page.html.toLowerCase().includes(word) ||
    (word.match(/^[\d-]*$/) && page.html.replace(/-/g, '').includes(word.replace(/-/g, '')))
}

function compareSearchIndexes(s1, s2, word) {
  const index1 = s1.indexOf(word)
  const index2 = s2.indexOf(word)

  if (index1 === index2) {
    return 0
  }

  if (index1 === -1) {
    return 1
  }

  if (index2 === -1) {
    return -1
  }

  return index1 - index2
}

const resultsCompare = (searchWords) => (a, b) => {
  const titleCompare = searchWords.map(w => compareSearchIndexes(a.title, b.title, w)).find(r => r)
  if (titleCompare) {
    return titleCompare
  }

  const htmlCompare = searchWords.map(w => compareSearchIndexes(a.html, b.html, w)).find(r => r)
  if (htmlCompare) {
    return htmlCompare
  }

  return a.title.localeCompare(b.title)
}

async function performSearch(search) {
  const searchWords = parseToWords(search.toLowerCase()).map(s => s.trim()).filter(s => s)
  const items = activePages.filter(p => searchWords.every(w => isPageMatchWord(p, w))).sort(resultsCompare(searchWords))
  const tags = tagsList.filter(t => searchWords.every(w => t.includes(w)))
  if (items.length === 0 && tags.length === 0) {
    const mapped = mappedString(search)
    if (mapped) {
      return performSearch(mapped)
    }
  }
  return okResponse({ pages: items.slice(0, 30), totalCount: items.length, tags, search })
}

// URL: https://<wix-site-url>/_functions/search/<search>
export async function get_search(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const param = decodeURI(request.path[0])
  if (!param || !param.trim()) {
    return badRequest({ headers, body: 'Search cannot be empty' })
  }

  if (!activePages) {
    await loadCacheData()
  }

  return performSearch(param)
}

// URL: https://<wix-site-url>/_functions/pages
export async function get_pages(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  if (!allPages) {
    await loadCacheData()
  }

  const pages = request.query && request.query.UpdatedAfter ? allPages.filter(p => p._updatedDate.toISOString() >= request.query.UpdatedAfter) : allPages

  return okResponse({ pages, maxDate })
}

// URL: https://<wix-site-url>/_functions/tag/<tag>
export async function get_tag(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const searchedTag = decodeURI(request.path[0]).replace(/_/g, ' ').replace(/"/g, '')
  const { items } = activePages.filter(p => p.tags.includes(searchedTag))
  return okResponse({ pages: items })
}

// URL: https://<wix-site-url>/_functions/tags
export async function get_tags(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  if (!tagsList) {
    await loadCacheData()
  }

  return okResponse({ tags: tagsList })
}
