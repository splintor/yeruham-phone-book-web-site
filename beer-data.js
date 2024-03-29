// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pages } = require('./beer.json')
const csv = []

for (let p of pages) {
  if (p.isDeleted) {
    continue
  }
  if (!p.html) {
    console.log(p)
  } else {
    const phoneNumbers = Array.from(p.html?.matchAll(/\D((\d-?){9,10})\D/g)).map(r => r[1].replace(/-/g, ''))
    if (phoneNumbers.length > 0) {
      csv.push([p.title, ...phoneNumbers, ...p.tags])
    // } else {
    //   console.log('No numbers: ', p.title);
    }
  }
}

// console.log('CSV count: ', csv.length);
console.log(csv.join('\n'))
