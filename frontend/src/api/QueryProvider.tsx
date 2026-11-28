import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

import { createQueryClient } from './queryClient'

export function QueryProvider({ client, children }: { client?: QueryClient; children: ReactNode }) {
  const [defaultClient] = useState(() => createQueryClient())
  return <QueryClientProvider client={client ?? defaultClient}>{children}</QueryClientProvider>
}
