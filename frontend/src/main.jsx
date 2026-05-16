import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './i18n'
import App from './App.jsx'
import { SystemConfigProvider } from './context/SystemConfigContext'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SystemConfigProvider>
        <App />
      </SystemConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
