function Error(props) {
  return (
    <p>
      {props.statusCode
        ? `קרתה שגיאה מספר ${props.statusCode} בשרת`
        : <div>
          <span>קרתה שגיאה בדפדפן:</span>
          <pre style={{color: 'red'}}>{JSON.stringify(props, null, 2)}</pre>
        </div>}
    </p>
  )
}

Error.getInitialProps = (props) => {
  const statusCode = props.res ? props.res.statusCode : props.err ? props.err.statusCode : undefined
  return { statusCode }
}

// noinspection JSUnusedGlobalSymbols
export default Error
