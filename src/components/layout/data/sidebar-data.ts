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
  HelpCircle,
  Library,
  CalendarCheck,
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
          title: 'Programs',
          icon: Library,
          items: [
            {
              title: 'All Programs',
              url: '/apps',
            },
          ],
        },
      ],
    },
    {
      title: 'Planning',
      items: [
        {
          title: 'Curriculum',
          icon: BookOpen,
          items: [
            {
              title: 'Structure',
              url: '/help-center',
            },
          ],
        },
        {
          title: 'Term Planning',
          icon: CalendarCheck,
          items: [
            {
              title: 'Current Plans',
              url: '/tasks',
            },
          ],
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
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
