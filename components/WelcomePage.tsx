import React, { ReactElement } from 'react'
import { adminEmail, adminPhone, siteTitle } from '../utils/consts'
import { SearchBox, SearchBoxProps } from './SearchBox'

export const WelcomePage = ({ authTitle, ...searchBoxProps }: { authTitle: string } & SearchBoxProps): ReactElement => (
  <div className="container d-flex mt-3">
    <div className="row align-self-center card border-primary mx-auto px-1 py-3">
      <div className="mb-2">
        {authTitle
          ? <label htmlFor="search-box">חיפוש אדם, עסק או מוסד<span className="d-md-inline d-none"> (אפשר גם <a href="/new_page">להוסיף דף חדש</a>)</span>:</label>
          : <label htmlFor="search-box">חיפוש עסק או מוסד ציבורי</label>}
      </div>
      <SearchBox {...searchBoxProps}/>
      <div className="mt-2">
        האתר זמין גם כ<a href="https://play.google.com/store/apps/details?id=com.splintor.yeruhamphonebook">אפליקצית
        אנדרואיד</a> וכ<a href="https://groups.google.com/d/msg/yerucham1/QWQYnxeXNfU/Q104gimvAAAJ">בוט בטלגרם</a>
      </div>
      <div className="mt-2">
        הסבר על השימוש באתר אפשר למצוא <a href="/help">כאן</a>
      </div>
      <div className="mt-2">
        הערות והצעות כדאי לשלוח ב<a href={`mailto:${adminEmail}?subject=ספר הטלפונים של ירוחם`}>מייל</a> או ב<a href={`https://wa.me/${adminPhone.replace(/^0/, '+972-')}`}>ווטסאפ</a>
      </div>
      <a href="/" className="mt-3 d-flex justify-content-center">
        <img src="/logo.png" alt={siteTitle} width={'75%'}/>
      </a>
    </div>
  </div>
)
