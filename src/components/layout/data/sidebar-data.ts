import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  UserCog,
  Palette,
  Bell,
  Monitor,
  Wrench,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Academic Advisor',
    email: 'advisor@university.edu',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Academic Planner',
      logo: GraduationCap,
      plan: 'Advisor Portal',
    },
  ],
  navGroups: [
    {
      title: 'Academic',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Students',
          url: '/students',
          icon: Users,
        },
        {
          title: 'Curriculum Explorer',
          url: '/curriculum',
          icon: BookOpen,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
      ],
    },
  ],
}
