import React, { FormEvent, useCallback, useState } from 'react';
import { adminEmail, adminPhone, functionsUrl, siteTitle } from '../consts';

const defaultLoginHandler = () => {
  location.reload();
  return true;
}

enum ErrorType {
  None,
  NotFound,
  NetworkError
}

function renderError(errorType: ErrorType) {
  switch (errorType) {
    case ErrorType.None:
      return <img src="/logo.png" alt={siteTitle} />

    case ErrorType.NetworkError:
      return 'אירעה תקלה בתקשורת עם השרת (כן, כן, התקשורת אשמה...)';

    case ErrorType.NotFound:
      return <div>
        מספר הטלפון שהוכנס לא קיים בספר הטלפונים.
        <div className="contact">אם הינך תושב/ת ירוחם, שלח/י את פרטיך
        ל-<a href={`mailto:${adminEmail}?subject=נא להוסיף אותי לספר הטלפונים של ירוחם`}>{adminEmail}</a>{' '}<br/>
        או למספר <span className="adminPhone">{adminPhone}</span> ונשמח להוסיף אותך!
        </div>
      </div>
  }
}

export function LoginPage({ onLogin = defaultLoginHandler }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorType, setErrorType] = useState(ErrorType.None)

  const isLoginDisabled = phoneNumber?.replace(/[-+]/g, '').length < 9 || isLoading
  const loginTitle = isLoading ? 'בודק...' : 'אישור'

  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setErrorType(ErrorType.None);
    setIsLoading(true);
    try {
      const res = await fetch(`${functionsUrl}/login/${phoneNumber}`);
      if (res.ok) {
        const auth = await res.text();
        document.cookie = `auth=${auth}`
        const onLoginResult = onLogin && onLogin();
        if (onLoginResult) {
          return; // leave isLoading true until page is reloaded
        }
      } else {
        setErrorType(ErrorType.NotFound)
      }
    } catch (e) {
      console.error('failed to login', e)
      setErrorType(ErrorType.NetworkError)
    }
    setIsLoading(false);
  }, [phoneNumber])

  return <div className="loginPage">
    <h3 className="title">{siteTitle}</h3>
    <div>ספר הטלפונים מיועד לתושבי ירוחם בלבד.</div>
    <div>כדי לוודא שהינך תושב/ת ירוחם, יש להכניס את מספר הטלפון שלך:</div>
    <form onSubmit={onSubmit} >
      <input type="phone" disabled={isLoading} value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)}/>
      <button type="submit" disabled={isLoginDisabled}>{loginTitle}</button>
    </form>
    <div className={'error ' + ErrorType[errorType]}>{renderError(errorType)}</div>
  </div>
}
