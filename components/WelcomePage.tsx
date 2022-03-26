import React, { ReactElement } from 'react'
import siteInfo from '../site-info.json'
import { publicTagName } from '../utils/consts'
import { Logo } from './Logo'
import { SearchBox, SearchBoxProps } from './SearchBox'

// noinspection HtmlUnknownTarget
export const WelcomePage = ({ authTitle, ...searchBoxProps }: { authTitle: string } & SearchBoxProps): ReactElement => (
  <div className="container d-flex mt-3">
    <div className="row align-self-center card border-primary mx-auto px-1 py-3">
      <div className="mb-2">
        {siteInfo.welcomeSearchTitle ? <label htmlFor="search-box">{siteInfo.welcomeSearchTitle}</label> : authTitle
          ? <label htmlFor="search-box">חיפוש אדם, <a href={`/tag/${publicTagName}`}>עסק או מוסד</a><span
            className="d-md-inline d-none"> (אפשר גם <a href="/new_page">להוסיף דף חדש</a>)</span>:</label>
          : <label htmlFor="search-box">חיפוש <a href={`/tag/${publicTagName}`}>עסק או מוסד ציבורי</a>:</label>}
      </div>
      <SearchBox {...searchBoxProps}/>
      {siteInfo.androidAppLink && siteInfo.telegramBotLink && (
        <div className="mt-2">
          האתר זמין גם כ<a href={siteInfo.androidAppLink}>אפליקצית
          אנדרואיד</a> וכ<a href={siteInfo.telegramBotLink}>בוט בטלגרם</a>
        </div>
      )}
      <div className="mt-2">
        הסבר על השימוש באתר אפשר למצוא <a href="/help">כאן</a>
      </div>
      <div className="mt-2">
        הערות והצעות כדאי לשלוח ב<a href={`mailto:${siteInfo.adminEmail}?subject=${siteInfo.siteTitle}`}>מייל</a> או ב<a
        href={`https://wa.me/${siteInfo.adminPhone.replace(/^0/, '+972-')}`}>ווטסאפ</a>
      </div>
      <a href="/" className="mt-3 d-flex justify-content-center">
        <Logo width="75%"/>
      </a>
    </div>
  </div>
)
