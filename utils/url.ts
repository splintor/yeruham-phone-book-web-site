export const pageUrl = (title: string) => '/' + title.replace(/ /g, '_')
export const getSearchUrl = (search: string) => search ? `/search/${search}` : '/'
