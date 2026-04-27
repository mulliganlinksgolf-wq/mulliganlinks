'use client'

import { useEffect } from 'react'
import LogRocket from 'logrocket'
import setupLogRocketReact from 'logrocket-react'

interface Props {
  userId?: string
  userEmail?: string
  userName?: string
}

export function LogRocketProvider({ userId, userEmail, userName }: Props) {
  useEffect(() => {
    LogRocket.init('ceymwe/teeahead')
    setupLogRocketReact()

    if (userId) {
      LogRocket.identify(userId, {
        ...(userEmail && { email: userEmail }),
        ...(userName && { name: userName }),
      })
    }
  }, [userId, userEmail, userName])

  return null
}
