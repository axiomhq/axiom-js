import { useRef } from 'react';
import { equals } from 'remeda';
import React from 'react'

export const usePathname = (): [string, (val: string) => void] => {

  const initialPath = window.location.pathname.substr(1)

  const [path, setPath] = React.useState(initialPath)

  const changePath = (path: string) => {
    window.history.pushState({}, path, `/${path}`)
    setPath(path)
  }

  React.useEffect(
    () => {
      window.onpopstate = () => {
        setPath(window.location.pathname.substr(1))
      }
      return () => { window.onhashchange = null }
    },
    [],
  )

  return [path, changePath]
}

export function useDeepMemo<T extends Record<string, unknown>>(value: T) {
  const ref = useRef<T>();

  if (!equals(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}
