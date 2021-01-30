module.exports = {
  target: 'server',
  async rewrites() {
    return [
      {
        source: '/search-suggestions/:searchTerm',
        destination: `${process.env.WIX_PAGE_URL}/_functions/search/:searchTerm?suggestions=1`,
      },
      {
        source: '/api/login/:phoneNumber',
        destination: `${process.env.WIX_PAGE_URL}/_functions/login/:phoneNumber`,
      },
    ]
  },
}
