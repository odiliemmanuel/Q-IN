import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Building, Bed, Text, Square } from 'lucide-react';
import { Button } from './Button';
export function PropertyCard({ imageUrl, title, bedrooms, bathrooms, area, actions }) {
    return (_jsxs("div", { className: "group bg-card rounded-lg overflow-shadow p-4 transition-transform hover:hover:scale-105 duration-200", children: [_jsx("img", { src: imageUrl, alt: title, className: "w-full h-48 object-cover rounded-md mb-3" }), _jsx("h3", { className: "font-medium text-foreground line-clamp-2", children: title }), _jsxs("div", { className: "flex flex-col gap-1 text-sm", children: [_jsxs("div", { className: "flex items-center gap-1 text-muted", children: [_jsx(Building, { className: "w-2 h-2" }), " ", bedrooms, " bed"] }), _jsxs("div", { className: "flex items-center gap-1 text-muted", children: [_jsx(Text, { className: "w-2 h-2" }), " ", bathrooms, " bath"] }), _jsxs("div", { className: "flex items-center gap-1 text-muted", children: [_jsx(Square, { className: "w-2 h-2" }), " ", area, " sqft"] })] }), actions && _jsx(Button, { children: actions })] }));
}
