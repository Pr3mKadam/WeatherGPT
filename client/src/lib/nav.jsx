import {
  Activity,
  CloudSun,
  Droplets,
  FileText,
  Globe2,
  LayoutDashboard,
  Recycle,
  Settings,
  ShieldAlert,
  Sparkles,
  Wind,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    label: 'Monitor',
    items: [
      {
        to: '/app',
        label: 'Dashboard',
        icon: LayoutDashboard,
        end: true,
        description: 'A live overview of weather, air quality and environmental risk.',
      },
      {
        to: '/app/weather',
        label: 'Weather',
        icon: CloudSun,
        description: 'Current conditions, hourly detail and a 7-day forecast.',
      },
      {
        to: '/app/air',
        label: 'Air Pollution',
        icon: Wind,
        description: 'AQI, pollutant breakdown, trends and health guidance.',
      },
    ],
  },
  {
    label: 'Understand',
    items: [
      {
        to: '/app/water',
        label: 'Water Awareness',
        icon: Droplets,
        description: 'Water-quality indicators, pollution causes and conservation.',
      },
      {
        to: '/app/climate',
        label: 'Climate Change',
        icon: Globe2,
        description: 'Warming trends, impacts, mitigation and adaptation.',
      },
      {
        to: '/app/risk',
        label: 'Environmental Risk',
        icon: ShieldAlert,
        description: 'Computed advisories and a composite risk indicator.',
      },
      {
        to: '/app/analyzer',
        label: 'Weather–Pollution Analyzer',
        icon: Activity,
        description: 'How wind, humidity, rain and temperature relate to pollution.',
      },
    ],
  },
  {
    label: 'Act',
    items: [
      {
        to: '/app/assistant',
        label: 'AI Assistant',
        icon: Sparkles,
        description: 'Ask questions grounded in live local environmental data.',
      },
      {
        to: '/app/sustainability',
        label: 'Sustainability',
        icon: Recycle,
        description: 'Carbon-footprint estimate, actions and everyday habits.',
      },
      {
        to: '/app/reports',
        label: 'Saved Reports',
        icon: FileText,
        description: 'Keep snapshots of conditions for your EVS work.',
      },
    ],
  },
];

export const SETTINGS_ITEM = {
  to: '/app/settings',
  label: 'Settings',
  icon: Settings,
  description: 'Appearance, alert thresholds, data sources and project details.',
};

export const NAV_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), SETTINGS_ITEM];

export function findNavItem(pathname) {
  return (
    NAV_ITEMS.find((item) => item.to === pathname) ||
    NAV_ITEMS.find((item) => item.to !== '/app' && pathname.startsWith(item.to)) ||
    NAV_ITEMS[0]
  );
}
