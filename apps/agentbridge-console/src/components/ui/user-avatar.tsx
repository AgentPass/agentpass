interface UserAvatarProps {
  user: { email: string; picture?: string | null };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <div
      className={`rounded-full bg-primary-foreground flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {user.picture ? (
        <img
          src={user.picture}
          alt={user.email}
          referrerPolicy="no-referrer"
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="font-medium text-primary">{getInitials(user.email)}</span>
      )}
    </div>
  );
}
