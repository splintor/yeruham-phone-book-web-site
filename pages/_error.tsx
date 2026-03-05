import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
}

function Error({ statusCode }: ErrorProps) {
  return (
    <p>
      {statusCode
        ? `קרתה שגיאה מספר ${statusCode} בשרת`
        : <span>
          <span>קרתה שגיאה בדפדפן</span>
        </span>}
    </p>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : undefined
  return { statusCode }
}

export default Error
