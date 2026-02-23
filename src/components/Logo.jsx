/**
 * Logo Component - Reusable KB Logo
 * Used across admin, buyer, and print views
 * Follows DRY principle
 */
const Logo = ({
  width = 40,
  height = 40,
  className = '',
  style = {},
  variant = 'default' // 'default', 'print', 'sidebar'
}) => {
  const logoStyles = {
    default: {
      width: `${width}px`,
      height: `${height}px`,
      objectFit: 'contain',
      ...style
    },
    print: {
      width: `${width}px`,
      height: `${height}px`,
      objectFit: 'contain',
      filter: 'grayscale(100%) brightness(0%)', // Convert to black
      ...style
    },
    sidebar: {
      width: `${width}px`,
      height: `${height}px`,
      objectFit: 'contain',
      // No filter - show original logo colors for visibility
      ...style
    }
  };

  return (
    <img
      src="/kb-offical-logo.webp"
      alt="KB Logo"
      style={logoStyles[variant]}
      className={className}
    />
  );
};

export default Logo;
