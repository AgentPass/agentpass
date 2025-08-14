import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

interface ReturnToLoginProps {
  variant?: "default" | "outline";
  className?: string;
}

export function ReturnToLogin({ variant = "default", className = "w-full" }: ReturnToLoginProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleReturnToLogin = () => {
    logout();
    navigate("/login");
  };

  return (
    <Button variant={variant} className={className} onClick={handleReturnToLogin}>
      Return to Login
    </Button>
  );
}
