interface IconProps {
  icon: string; // e.g. "iconoir:home"
  size?: number;
  className?: string;
}

const Icon = ({ icon, size = 24, className = "" }: IconProps) => {
  // Ensure the icon has the prefix if not provided (default to iconoir)
  const fullIconName = icon.includes(':') ? icon : `iconoir:${icon}`;
  const [prefix, name] = fullIconName.split(':');
  const url = `https://api.iconify.design/${prefix}/${name}.svg`;
  
  return (
    <span 
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: 'currentColor',
        maskImage: `url(${url})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: `url(${url})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
      }}
    />
  );
};

export default Icon;
