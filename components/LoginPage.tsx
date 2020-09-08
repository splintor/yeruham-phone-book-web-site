import React, { useCallback, useState } from 'react';
import { functionsUrl } from '../consts';

const defaultLoginHandler = () => {
  location.reload();
  return true;
}
export function LoginPage({ onLogin = defaultLoginHandler }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isLoginDisabled = phoneNumber?.length < 9 || isLoading
  const loginTitle = isLoading ? 'בודק...' : 'אישור'

  const onOK = useCallback(async () => {
    setErrorMessage('');
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
        setErrorMessage('מספר הטלפון שהוכנס לא קיים בספר הטלפונים')
      }
    } catch (e) {
      console.error('failed to login', e)
      setErrorMessage('אירעה תקלה בתקשורת עם השרת (כן, כן, התקשורת אשמה...)')
    }
    setIsLoading(false);
  }, [phoneNumber])

  return <div className="LoginPage">
    <div>ספר הטלפונים מיועד לתושבי ירוחם בלבד.</div>
    <div>כדי לוודא שהינך תושב/ת ירוחם, יש להכניס את מספר הטלפון שלך:</div>
    <div>
      <input type="phone" disabled={isLoading} value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)}/>
    </div>
    <div>
      <button onClick={onOK} disabled={isLoginDisabled}>{loginTitle}</button>
    </div>
    <div className="error">{errorMessage}</div>
  </div>
}
