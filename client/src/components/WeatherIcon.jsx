import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react';

const GROUP_ICONS = {
  clear: Sun,
  cloudy: CloudSun,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export default function WeatherIcon({ group = 'cloudy', isDay = true, size = 24, className = '', ...rest }) {
  let Icon = GROUP_ICONS[group] || Cloud;
  if (group === 'clear' && isDay === false) Icon = Moon;
  if (group === 'cloudy' && isDay === false) Icon = Cloud;
  if (group === 'storm') Icon = CloudHail;
  return <Icon size={size} className={className} aria-hidden="true" strokeWidth={1.7} {...rest} />;
}
