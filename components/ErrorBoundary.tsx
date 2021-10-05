import React, { ReactNode } from 'react'

interface State {
  error?: Error;
}

export class ErrorBoundary extends React.Component<unknown, State> {
  constructor(props: unknown) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: Error): State {    // Update state so the next render will show the fallback UI.
    return { error }
  }

  // componentDidCatch(error, errorInfo) {    // You can also log the error to an error reporting service
  //   logErrorToMyService(error, errorInfo);
  // }

  render(): ReactNode {
    const { error } = this.state
    if (error) {      // You can render any custom fallback UI
      return <div>
        <h1>אופס, משהו לא עובד...</h1>
        <div style={{color: 'red'}}>{error}</div>
      </div>
    }
    return this.props.children
  }
}
