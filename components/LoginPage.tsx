import React, { FormEvent, ReactElement, useEffect, useRef, useState } from 'react'
import { adminEmail, adminPhone, siteTitle } from '../utils/consts'
import { setAuthCookies } from '../utils/cookies'
import { GitHubCorner } from './GitHubCorner'

enum ErrorType {
  None,
  NotFound,
  NetworkError
}

function renderError(errorType: ErrorType) {
  switch (errorType) {
    case ErrorType.NetworkError:
      return 'אירעה תקלה בתקשורת עם השרת (כן, כן, התקשורת אשמה...)'

    case ErrorType.NotFound:
      return <div>
        מספר הטלפון שהוכנס לא קיים בספר הטלפונים.
        <div>אם הינך תושב/ת ירוחם, שלח/י את פרטיך
          ל-<a href={`mailto:${adminEmail}?subject=נא להוסיף אותי לספר הטלפונים של ירוחם`}>{adminEmail}</a>{' '}<br/>
          או למספר <span className="adminPhone">{adminPhone}</span> ונשמח להוסיף אותך!
        </div>
      </div>
  }
}

export function LoginPage(): ReactElement {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorType, setErrorType] = useState(ErrorType.None)
  const phoneInputRef = useRef<HTMLInputElement>()

  useEffect(() => {
    setTimeout(() => phoneInputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (errorType !== ErrorType.None) {
      setTimeout(() => {
        phoneInputRef.current?.select()
        phoneInputRef.current?.focus()
      }, 0)
    }
  }, [errorType])

  const isLoginDisabled = phoneNumber?.replace(/[-+]/g, '').length < 9 || isLoading
  const loginTitle = isLoading ? <span><span className="spinner-border spinner-border-sm me-1"/>בודק...</span> : 'כניסה'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorType(ErrorType.None)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/login/${phoneNumber}`)
      if (res.ok) {
        const { auth, authTitle } = await res.json()
        setAuthCookies(auth, authTitle)
        location.reload()
        return // leave isLoading true until page is reloaded
      } else {
        setErrorType(ErrorType.NotFound)
      }
    } catch (e) {
      setErrorType(ErrorType.NetworkError)
    }
    setIsLoading(false)
  }

  const onGuestLogin = async (e: FormEvent) => {
    e.preventDefault()
    setErrorType(ErrorType.None)
    location.href = '/?guestLogin'
  }

  const errorAlert = renderError(errorType)

  return <>
    <div className="container d-flex vh-100">
      <div className="row justify-content-center align-self-center card border-primary mx-auto">
        <img src="/logo.png" alt={siteTitle} className="card-img-top w-50 p-2  align-self-center"/>
        <h3 className="card-header card-title">{siteTitle}</h3>
        <div className="card-body p-2">
          <div>ספר הטלפונים מיועד לתושבי ירוחם בלבד.</div>
          <div>כדי לוודא שהינך תושב/ת ירוחם, יש להכניס את מספר הטלפון שלך:</div>
          <form onSubmit={onSubmit} className="row justify-content-center gx-2 py-3">
            <div className="col-auto">
              <input className="col-md-auto form-control"
                     ref={phoneInputRef}
                     type="tel"
                     pattern="[0-9]*"
                     size={12}
                     style={{ direction: 'rtl' }}
                     disabled={isLoading}
                     value={phoneNumber}
                     onChange={event => {
                       setPhoneNumber(event.target.value)
                       setErrorType(ErrorType.None)
                     }}/>
            </div>
            <div className="col-auto">
              <button className="col-md-auto btn btn-primary" type="submit"
                      disabled={isLoginDisabled}>{loginTitle}</button>
            </div>
          </form>

          <div>אם אינך מירוחם, תוכל/י להכנס כאורח/ת ולראות עסקים ומוסדות ציבור.</div>
          <form onSubmit={onGuestLogin} className="row justify-content-center gx-2 py-3">
            <div className="col-auto">
              <button className="btn btn-outline-secondary" type="submit">כניסה כאורח/ת</button>
            </div>
          </form>
          {errorAlert && <div className={'alert alert-danger ' + ErrorType[errorType]}>{errorAlert}</div>}
        </div>
      </div>
    </div>
    <GitHubCorner/>
  </>
}
