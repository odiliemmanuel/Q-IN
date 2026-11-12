import { Menu, MenuItem } from '@radix-ui/react-menu'
import { usePhone, Mail, LogOut, ChevronDown } from 'lucide-react'

export function UserProfileMenu() {
  return (
    <Menu>
      <button className="flex items-center gap-2 p-2 rounded hover:bg-border transition-colors" aria-label="User menu">
        <img
          src="/avatars/avatar-1.jpg"
          alt="User"
          className="w-8 h-8 rounded-full"
        />
        <span className="font-medium text-foreground">John Paul</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      <MenuContent>
        <MenuItem>
          <UsePhone className="w-4 h-4 mr-2" />
          Profile
        </MenuItem>
        <MenuItem>
          <Mail className="w-4 h-4 mr-2" />
          Settings
        </MenuItem>
        <MenuItem onClick={() => alert('Logout clicked')}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}