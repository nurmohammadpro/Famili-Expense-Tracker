const Card = ({ children, variant = "default", className = "", ...props }) => {
  const variantClass = variant === "primary" ? "card-primary" : "";
  return (
    <div className={`card ${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
};
export default Card;
