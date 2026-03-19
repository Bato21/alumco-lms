// src/components/alumco/LogoutButton.tsx
'use client'

import { useTransition } from 'react'
import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  compact?: boolean
}

export function LogoutButton({ compact = false }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        disabled={isPending}
        aria-label="Cerrar sesión"
        className="h-10 w-10"
      >
        {isPending
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          : <LogOut className="h-4 w-4" aria-hidden="true" />
        }
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isPending}
      className="w-full justify-start gap-2 text-muted-foreground h-10"
    >
      {isPending
        ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        : <LogOut className="h-4 w-4" aria-hidden="true" />
      }
      Cerrar sesión
    </Button>
  )
}