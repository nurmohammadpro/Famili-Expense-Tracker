const Input = ({ label, icon, error, ...props }) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-sm font-bold flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {label}
        </label>
      )}
      <div className="relative">
        {props.type === "number" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-sm"></span>
        )}
        <input
          className={`input-base ${props.type === "number" ? "pl-7" : ""} ${error ? "input-error" : ""}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error animate-fade-in">{error}</p>}
    </div>
  );
};

export default Input;
