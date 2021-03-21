export const pageUrl = (title: string): string => '/' + title.replace(/ /g, '_')
export const getSearchUrl = (search: string): string => search ? `/search/${search}` : '/'
