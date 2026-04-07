'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePendingRequestsCount() {
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPendingCount() {
      const supabase = createClient()

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente')

      if (!error && count !== null) {
        setCount(count)
      }

      setIsLoading(false)
    }

    fetchPendingCount()
  }, [])

  return { count, isLoading }
}
