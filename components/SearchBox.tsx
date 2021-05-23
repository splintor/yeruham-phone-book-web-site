import React, { BaseSyntheticEvent, ReactElement, useEffect, useRef } from 'react'

export interface SearchBoxProps {
  search: string
  performSearch(e: BaseSyntheticEvent)
  markUserEdit(userSearch: string): void
  searchFocusId: number
  className?: string
}

export function SearchBox({ search, ...props }: SearchBoxProps): ReactElement {
  const searchInput = useRef(null)
  const focusSearchInput = (element = null) => {
    if (element) {
      searchInput.current = element
    }

    if (searchInput.current) {
      searchInput.current.focus()
    }
  }

  useEffect(focusSearchInput, [props.searchFocusId])

  return <form className={'pe-2 navbar-search-form ' + (props.className || '')} onSubmit={props.performSearch}>
    <div className="input-group">
      <input className="form-control rounded-1 rounded-pill shadow-none" type="search" value={search} ref={focusSearchInput}
             onChange={e => props.markUserEdit(e.target.value)}/>
      <button type="submit" className="btn btn-link text-primary" onClick={props.performSearch}>
          <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '20px' }}>
            <path style={{ fill: search ? 'grey' : 'lightgrey' }}
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
      </button>
    </div>
  </form>
}
