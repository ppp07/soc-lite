import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { QueryProvider } from './api/QueryProvider'
import './index.css'
import { createAppRouter } from './router'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={createAppRouter()} />
    </QueryProvider>
  </StrictMode>,
)
