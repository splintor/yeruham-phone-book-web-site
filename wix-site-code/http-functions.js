// noinspection NpmUsedModulesInstalled
import { response, ok, created, notFound, badRequest } from 'wix-http-functions'
// noinspection NpmUsedModulesInstalled
import wixData from 'wix-data'
// noinspection NpmUsedModulesInstalled
import { fetch } from 'wix-fetch'
import {
  adminPhoneNumber,
  mobileAppPhoneNumber,
  authPassword,
  telegramBotApiToken,
  telegramUpdateChannelChatId,
  telegramInfoChannelChatId,
  telegramBotPhoneNumber
} from './secret'
import { encrypt, decrypt, getKeyFromPassword } from './crypt'
import { mappedString } from './hebrewMapping'

const publicTagName = 'ציבורי'
const headers = { 'Content-Type': 'text/plain; charset=utf-8' }
const okResponse = body => ok({ headers, body })
const removePhoneDelimiters = s => s.replace(/[+\-.]+/g, '')
const authPrefix = 'PHONE '
const authKey = getKeyFromPassword(authPassword)
const buildAuth = phoneNumber => authPrefix + encrypt(phoneNumber, authKey)

const unauthorizedResponse = message => response({ headers, status: 401, body: { message } })
const suppressAuthAndHooks = { suppressAuth: true, suppressHooks: true }

let allPages
let maxDate
let activePages
let phones
let tagsList

async function sendToTelegram(chatId, message) {
  await fetch(`https://api.telegram.org/bot${telegramBotApiToken}/sendMessage?chat_id=${chatId}&parse_mode=Markdown&text=${encodeURIComponent(message)}`, { method: 'get' })
}

const sendUpdateLog = message => void sendToTelegram(telegramUpdateChannelChatId, message)
const sendInfoLog = message => void sendToTelegram(telegramInfoChannelChatId, message)

function getIdentityPage(pageA, pageB) {
  if (!pageA.tags || pageA.tags.length === 0) {
    return pageA
  }

  if (!pageB.tags || pageB.tags.length < pageA.tags.length) {
    return pageB
  }

  return pageA
}

async function loadCacheData(phoneNumber) {
  // const start = Date.now()
  let pagesList = []
  let result = await wixData.query('pages').limit(1000).find()
  while (result) {
    pagesList = pagesList.concat(result.items)
    result = result.hasNext() && await result.next()
  }

  await processData(phoneNumber, pagesList)

  // const timeSpan = Date.now() - start
  // const title = getPhoneTitle(phoneNumber)
  // const info = `המידע כולל ${activePages.length} דפים, ${phones.size} מספרי טלפון ו-${tagsList.length} קטגוריות. עודכן לאחרונה ב-${new Date(maxDate).toLocaleString()}.`
  // if (title) {
  //   sendInfoLog(`המידע נטען לזכרון תוך ${timeSpan / 1000} שניות ע"י ${title}. ${info}`)
  // } else {
  //   sendInfoLog(`המידע נטען לזכרון תוך ${timeSpan / 1000} שניות. ${info}`)
  // }
}

async function processData(phoneNumber, pagesList) {
  allPages = pagesList
  maxDate = allPages.length > 0 ? allPages.reduce((d, p) => Math.max(p._updatedDate, d), allPages[0]._updatedDate) : undefined
  activePages = pagesList.filter(p => !p.isDeleted)

  const phonesMap = new Map()
  const tagsSet = new Set()
  activePages.forEach(page => {
    const matches = page.html.replace(/[+\-.]+/g, '').match(/[^A-Z_\d=\/:]\d{9,}/g)
    matches && matches.forEach(match => {
      match = match.substr(1)
      const existing = phonesMap.get(match)
      if (!existing || page === getIdentityPage(existing, page)) {
        phonesMap.set(match, page)
      }
    })

    page.tags && page.tags.forEach(tagsSet.add, tagsSet)
  })

  phones = phonesMap
  tagsList = [...tagsSet]
}

// URL: https://<wix-site-url>/_functions/login/<phoneNumber>
// noinspection JSUnusedGlobalSymbols
export async function get_login(request) {
  const phoneNumber = request.path[0]

  if (specialNumbers[phoneNumber]) {
    sendInfoLog(`בוצעה כניסה למערכת בעזרת המספר *${phoneNumber}*`)
    return okResponse({ auth: buildAuth(phoneNumber), authTitle: getPhoneTitle(phoneNumber) })
  }

  const strippedPhoneNumber = removePhoneDelimiters(phoneNumber)
  if (!strippedPhoneNumber || strippedPhoneNumber.length < 9) {
    return unauthorizedResponse('Login phone number is too short')
  }

  if (!phones) {
    await loadCacheData(phoneNumber)
  }

  let foundPage = phones.get(strippedPhoneNumber)

  if (!foundPage) {
    await loadCacheData(phoneNumber)
    foundPage = phones.length > 0 ? phones.get(strippedPhoneNumber) : { title:  'כניסה ראשונית'}
  }

  if (foundPage) {
    sendInfoLog(`בוצעה כניסה למערכת ע"י *${foundPage.title}* בעזרת המספר *${phoneNumber}*`)
    return okResponse({ auth: buildAuth(phoneNumber), authTitle: foundPage.title })
  } else {
    sendInfoLog(`בוצע נסיון כושל להכנס למערכת מהמספר *${phoneNumber}*`)
    return unauthorizedResponse('Failed to log in')
  }
}

const specialNumbers = {
  [adminPhoneNumber]: 'מנהל מערכת',
  [mobileAppPhoneNumber]: 'אפליקציית ספר הטלפונים',
  [telegramBotPhoneNumber]: 'בוט טלגרם',
}

function getPhoneNumberFromPhonesList(phoneNumber) {
  const page = phones.get(phoneNumber)
  return page ? `${page.title} (${phoneNumber})` : phoneNumber
}

function getPhoneTitle(phoneNumber) {
  return specialNumbers[phoneNumber] || getPhoneNumberFromPhonesList(phoneNumber)
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

    if (specialNumbers[phoneNumber]) {
      return okResponse({ phoneNumber })
    }

    if (requireAdmin) {
      return unauthorizedResponse(`Admin request done by non-admin: ${phoneNumber}`)
    }

    if (!phones) {
      await loadCacheData(phoneNumber)
    }

    const strippedPhoneNumber = removePhoneDelimiters(phoneNumber)
    if (phones.size > 0 && !phones.has(strippedPhoneNumber)) {
      return unauthorizedResponse(`Auth phone not found: ${strippedPhoneNumber}`)
    }

    return okResponse({ phoneNumber: strippedPhoneNumber })
  } catch (exception) {
    return unauthorizedResponse('Failed to parse authentication header')
  }
}

const pageRedirects = {
  help: 'הסבר על השימוש באתר',
}

// URL: https://<wix-site-url>/_functions/page/<titleOrOldName>
// noinspection JSUnusedGlobalSymbols
// noinspection JSUnusedGlobalSymbols
export async function get_page(request) {
  const loginCheck = await get_checkLogin(request)

  if (!activePages) {
    await loadCacheData(loginCheck.body.phoneNumber)
  }

  const param = decodeURI(request.path[0])
  const titleToSearch = (pageRedirects[param] || param).replace(/_/g, ' ')
  let item = activePages.find(p => p.title === titleToSearch || p.oldName === param)
  if (!item) {
    sendInfoLog(`הדף *${titleToSearch}* לא נמצא. טוען מידע מחדש.`)
    await loadCacheData(loginCheck.body.phoneNumber)
    item = activePages.find(p => p.title === titleToSearch || p.oldName === param)
  }

  const title = getPhoneTitle(loginCheck.body.phoneNumber)
  if (item && (loginCheck.status === 200 || (item.tags && item.tags.includes(publicTagName)))) {
    if (title) {
      sendInfoLog(`הדף *${item.title}* נפתח ע"י *${title}*`)
    } else {
      sendInfoLog(`הדף הציבורי *${item.title}* נפתח`)
    }
    return okResponse(item)
  } else {
    if (item) {
      sendInfoLog(`בוצע נסיון חיצוני לגשת לדף הפנימי *${item.title}*`)
    } else if (title) {
      sendInfoLog(`בוצע נסיון לגשת לדף הלא קיים *${param}* ע"י *${title}*`)
    } else {
      sendInfoLog(`בוצע נסיון לגשת לדף הלא קיים *${param}*`)
    }
    return notFound({ headers, body: { title: titleToSearch, error: `'${param}' was not found` } })
  }
}

// noinspection JSUnusedGlobalSymbols
export async function post_log(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const { text } = await request.body.json()
  sendInfoLog(text)

  return okResponse({ message: `Text "${text}" was sent to log` })
}

// noinspection JSUnusedGlobalSymbols
export async function post_page(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  const { page } = await request.body.json()
  const isExistingPage = Boolean(page._id)
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

    await wixData.save('pages_history', {
      pageId: existing._id,
      changedBy: phoneNumber,
      oldTitle: existing.title,
      oldHtml: existing.html,
      oldTags: existing.tags
    }, suppressAuthAndHooks)
    if (page.isDeleted) {
      updateMessage = `הדף *${page.title}* נמחק ע"י ${getPhoneTitle(phoneNumber)}`
    } else if (existing.isDeleted) {
      updateMessage = `הדף *${page.title}* שוחזר ע"י ${getPhoneTitle(phoneNumber)}`
    } else {
      updateMessage = `הדף *${page.title}* עודכן ע"י ${getPhoneTitle(phoneNumber)}`
    }
  } else {
    updateMessage = `הדף *${page.title}* נוצר ע"י ${getPhoneTitle(phoneNumber)}`
    page.createdBy = phoneNumber
  }

  const { _id } = await wixData.save('pages', page, suppressAuthAndHooks)
  sendUpdateLog(updateMessage)
  sendInfoLog(updateMessage)

  // const start = Date.now()
  if (!page._id) {
    page._id = _id
  }
  const updatedSitesList = isExistingPage ? allPages.map(p => p._id === _id ? page : p) : [...allPages, page]
  await processData(phoneNumber, updatedSitesList)

  // const timeSpan = Date.now() - start
  // const title = getPhoneTitle(phoneNumber)
  // if (title) {
  //   sendInfoLog(`המידע עודכן בזכרון תוך ${timeSpan / 1000} שניות ע"י ${title}`)
  // } else {
  //   sendInfoLog(`המידע עודכן בזכרון תוך ${timeSpan / 1000} שניות`)
  // }

  return isExistingPage ?
    okResponse({ message: `Page ${page.title} was updated` }) :
    created({ headers, body: { message: `Page ${page.title} was created`, _id } })
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

  return [...parseToWords(s.substring(0, pos)), s.substring(pos + 1, nextPos), ...parseToWords(s.substring(nextPos + 1))]
}

function searchable(s) {
  return s
    .toLowerCase()
    .replace(/[-"']/g, '')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ץ/g, 'צ')
    .replace(/ף/g, 'פ')
    .replace(/ך/g, 'כ')
}

function isPageMatchWord(page, word) {
  if (word.startsWith('##') || word.startsWith('__') || word.startsWith('$$') || word.startsWith('~~')) {
    const re = new RegExp(word.substring(2))
    return page.title.match(re) || page.html.match(re) || page.html.replace(/-/g, '').match(re)
  }

  const searchableWord = searchable(word)

  return searchable(page.title).includes(searchableWord) ||
    searchable(page.html).includes(searchableWord) ||
    (page.tags && page.tags.some(t => t.includes(word)))
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

function performSearch(search, isLoggedIn) {
  const searchWords = parseToWords(search.toLowerCase()).map(s => s.trim()).filter(s => s)
  const items = activePages.filter(p => searchWords.every(w => isPageMatchWord(p, w))).sort(resultsCompare(searchWords))
  const tags = tagsList.filter(t => searchWords.every(w => t.includes(w))).sort()
  if (items.length === 0 && tags.length === 0) {
    const mapped = mappedString(search)
    if (mapped) {
      return performSearch(mapped, isLoggedIn)
    }
  }

  const itemsToReturn = isLoggedIn ? items : items.filter(p => p.tags && p.tags.includes(publicTagName))
  return { pages: itemsToReturn.slice(0, 30), totalCount: itemsToReturn.length, tags, search }
}

// URL: https://<wix-site-url>/_functions/search/<search>
// noinspection JSUnusedGlobalSymbols
// noinspection JSUnusedGlobalSymbols
export async function get_search(request) {
  const isSuggestionsRequest = Boolean(request.query && request.query.suggestions)
  const param = decodeURI(request.path[0])
  if (!param || !param.trim()) {
    return badRequest({ headers, body: 'Search cannot be empty' })
  }

  let isLoggedIn, phoneNumber
  if (isSuggestionsRequest) {
    isLoggedIn = true
  } else {
    const loginCheck = await get_checkLogin(request)
    phoneNumber = loginCheck.body && loginCheck.body.phoneNumber
    isLoggedIn = loginCheck.status === 200
  }

  if (!activePages) {
    await loadCacheData(phoneNumber)
  }

  const searchResults = performSearch(param, isLoggedIn)
  const result = isSuggestionsRequest
    ? [param, searchResults.pages.length > 0 ? searchResults.pages.map(p => p.title) : [`{ לא נמצאו תוצאות חיפוש עבור "${param}" }`]]
    : searchResults

  if (isSuggestionsRequest) {
    sendInfoLog(`בוצע חיפוש משורת הכתובת של *${param}*, וחזרו *${searchResults.pages.length}* דפים`)
  } else if (phoneNumber) {
    sendInfoLog(`בוצע חיפוש של *${param}* ע"י *${getPhoneTitle(phoneNumber)}*, וחזרו *${searchResults.pages.length}* דפים`)
  } else {
    sendInfoLog(`בוצע חיפוש של *${param}*, וחזרו *${searchResults.pages.length}* דפים`)
  }
  return okResponse(result)
}

// URL: https://<wix-site-url>/_functions/pages
// noinspection JSUnusedGlobalSymbols
export async function get_pages(request) {
  const loginCheck = await get_checkLogin(request)
  if (loginCheck.status !== 200) {
    return loginCheck
  }

  if (!allPages) {
    await loadCacheData(loginCheck.body.phoneNumber)
  }

  const updatedAfter = request.query && request.query.UpdatedAfter
  const requestedBy = request.query && request.query.RequestedBy
  const pages = updatedAfter ? allPages.filter(p => p._updatedDate.toISOString() > updatedAfter) : allPages

  let title = getPhoneTitle(loginCheck.body.phoneNumber)
  if (requestedBy) {
    const requestedByTitle = getPhoneTitle(requestedBy)
    title += ` (בשם ${requestedByTitle})`
  }
  if (updatedAfter) {
    sendInfoLog(`בוצעה בקשה לרשימת הדפים מאז *${updatedAfter}* ע"י *${title}*, וחזרו *${pages.length}* דפים`)
  } else {
    sendInfoLog(`בוצעה בקשה לרשימת הדפים ע"י *${title}*, וחזרו *${pages.length}* דפים`)
  }

  return okResponse({ pages, maxDate })
}

// URL: https://<wix-site-url>/_functions/tag/<tag>
// noinspection JSUnusedGlobalSymbols
export async function get_tag(request) {
  const searchedTag = decodeURI(request.path[0]).replace(/_/g, ' ').replace(/"/g, '')

  if (!allPages) {
    await loadCacheData()
  }

  const loginCheck = await get_checkLogin(request)
  const isLoggedIn = searchedTag === publicTagName || loginCheck.status === 200
  const pages = activePages.filter(p => p.tags && p.tags.includes(searchedTag) && (isLoggedIn || p.tags.includes(publicTagName)))
    .sort((a, b) => a.title.localeCompare(b.title))
  const tagsSet = new Set()
  pages
    .filter(p => p.tags.length > 1)
    .forEach(p => p.tags
      .filter(t => t !== searchedTag && t !== publicTagName && !pages.every(p2 => p2.tags.includes(t)))
      .forEach(t => tagsSet.add(t)))

  const tags = tagsSet.size > 0 ? Array.from(tagsSet).sort() : undefined

  const title = getPhoneTitle(loginCheck.body && loginCheck.body.phoneNumber)
  if (title) {
    sendInfoLog(`בוצעה בקשה של רשימת הדפים בקטגוריה *${searchedTag}* ע"י *${title}*, וחזרו *${pages.length}* דפים`)
  } else {
    sendInfoLog(`בוצעה בקשה של רשימת הדפים בקטגוריה *${searchedTag}*, וחזרו *${pages.length}* דפים`)
  }

  return okResponse({ pages, tags })
}

// URL: https://<wix-site-url>/_functions/tags
// noinspection JSUnusedGlobalSymbols
export async function get_tags() {
  if (!tagsList) {
    await loadCacheData()
  }

  sendInfoLog('בוצעה בקשה של רשימת כל הקטגוריות')
  return okResponse({ tags: tagsList })
}
