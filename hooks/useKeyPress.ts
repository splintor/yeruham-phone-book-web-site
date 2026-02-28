// Hook

import { useEffect, useState } from 'react'


export function useKeyPress(targetKey: string): KeyboardEvent | undefined {
  const [keyPressed, setKeyPressed] = useState<KeyboardEvent>()

  function downHandler(event: KeyboardEvent) {
    if (event.key === targetKey) {
      setKeyPressed(event)
    }
  }


  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(undefined)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, []) // Empty array ensures that effect is only run on mount and unmount

  return keyPressed
}
