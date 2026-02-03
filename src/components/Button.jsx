const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    error: "btn-error",
    success: "btn-success",
  };

  const sizes = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };
  return (
    <button className={`btn ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
