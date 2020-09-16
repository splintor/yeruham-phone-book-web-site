const admin = require('firebase-admin')
const fs = require('fs')
const cache = require('memory-cache')
const express = require('express')
const next = require('next')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dir: '.', dev })

const handle = app.getRequestHandler()

const removePhoneDelimiters = s => s.replace(/[+\-.]+/g, '')
const serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT, 'base64').toString())

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

function loadData() {
  initFirestore()
  console.debug('getting data...')
  return admin.firestore().collection('pages').get().then(data => {
    console.debug('got data', data.docs.length)
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
    const phones = new Map()
    pages.forEach(page => {
      const matches = removePhoneDelimiters(page.html).match(/[^A-Z_\d=\/:]\d{9,}/g)
      matches && matches.forEach(match => {
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
    return {
      pages,
      pagesByTitle,
      phones,
    }
  }).catch(e => {
    console.error('Failed to load firestore data:', e)
  })
}

app.prepare().then(loadData).then(data => {
  const server = express()
  server.get('*', (req, res) => {
    req.customData = data
    req.customNumber = 42
    console.log('server.get', req.url)
    return null;//handle(req, res)
  })
  server.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
}).catch(ex => {
  console.error('server error has occurred', ex)
  process.exit(1)
})
