import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import './index.css';
const queryClient = new QueryClient();
createRoot(document.getElementById('root')).render(_jsx(QueryClientProvider, { client: queryClient, children: _jsxs("div", { children: [_jsx("nav", { children: _jsx("a", { href: "/dashboard", children: "Dashboard" }) }), _jsx("main", { children: _jsx("p", { children: "Dashboard application - routes to be configured" }) })] }) }));
