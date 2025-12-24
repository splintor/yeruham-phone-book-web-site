async function getAuthToken() {
  // First, try to get auth token from environment variable
  if (process.env.AUTH_TOKEN) {
    return process.env.AUTH_TOKEN
  }

  // If not, try to get it via login API using phone number
  if (process.env.PHONE_NUMBER) {
    const phoneNumber = process.env.PHONE_NUMBER.replace(/[-+]/g, '')
    const loginResponse = await fetch(`https://yeruham-phone-book.vercel.app/api/login/${phoneNumber}`)
    if (!loginResponse.ok) {
      throw new Error(`Failed to login with phone number: ${loginResponse.status}`)
    }
    const { auth } = await loginResponse.json()
    return auth
  }

  throw new Error('Authentication required. Please set AUTH_TOKEN or PHONE_NUMBER environment variable.')
}

async function fetchAndProcessData() {
  try {
    const authToken = await getAuthToken()
    
    const response = await fetch('https://yeruham-phone-book.vercel.app/api/allPages', {
      headers: {
        'Authorization': authToken,
        'Cookie': `auth=${authToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const { pages } = await response.json()
    const csv = []

    for (let p of pages) {
      if (p.isDeleted) {
        continue
      }
      if (!p.html) {
        console.log(p)
      } else {
        const phoneNumbers = Array.from(p.html?.matchAll(/\D((\d-?){9,10})\D/g)).map(r => "'" + r[1].replace(/-/g, ''))
        if (phoneNumbers.length > 0) {
          csv.push([p.title, ...phoneNumbers])
        // } else {
        //   console.log('No numbers: ', p.title);
        }
      }
    }

    csv.sort((a, b) => a[0].localeCompare(b[0]))

    // console.log('CSV count: ', csv.length);
    console.log(csv.join('\n'))
  } catch (error) {
    console.error('Error fetching data:', error)
    process.exit(1)
  }
}

fetchAndProcessData()
