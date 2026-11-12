import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, MenuItem } from '@radix-ui/react-menu';
import { usePhone, Mail, LogOut, ChevronDown } from 'lucide-react';
export function UserProfileMenu() {
    return (_jsxs(Menu, { children: [_jsxs("button", { className: "flex items-center gap-2 p-2 rounded hover:bg-border transition-colors", "aria-label": "User menu", children: [_jsx("img", { src: "/avatars/avatar-1.jpg", alt: "User", className: "w-8 h-8 rounded-full" }), _jsx("span", { className: "font-medium text-foreground", children: "John Paul" }), _jsx(ChevronDown, { className: "w-4 h-4" })] }), _jsxs(MenuContent, { children: [_jsxs(MenuItem, { children: [_jsx(UsePhone, { className: "w-4 h-4 mr-2" }), "Profile"] }), _jsxs(MenuItem, { children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), "Settings"] }), _jsxs(MenuItem, { onClick: () => alert('Logout clicked'), children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), "Logout"] })] })] }));
}
