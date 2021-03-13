import Document, { Html, Head, Main, NextScript } from 'next/document'
import React from 'react'

export default class extends Document {
  render() {
    return (
      <Html dir="rtl" lang="he">
        <Head/>
        <body>
          <Main/>
          <NextScript/>
        </body>
      </Html>
    )
  }
}
