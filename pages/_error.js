function Error({ statusCode, err }) {
  return (
    <p>
      {statusCode
        ? `קרתה שגיאה מספר ${statusCode} בשרת`
        : <div>
          <span>קרתה שגיאה בדפדפן:</span>
          <pre style={{color: 'red'}}>{JSON.stringify(err || {}, null, 2)}</pre>
        </div>}
    </p>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode, err }
}

// noinspection JSUnusedGlobalSymbols
export default Error
