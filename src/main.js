import { jsx as _jsx } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
const queryClient = new QueryClient();
const container = document.getElementById('root');
if (!container)
    throw new Error('Root element not found');
createRoot(container).render(_jsx(React.StrictMode, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(App, {}) }) }));
