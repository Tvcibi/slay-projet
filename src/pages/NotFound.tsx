import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import logo from '@/assets/logo.png';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img src={logo} alt="FlashWorld" className="w-16 h-16 mx-auto mb-6 rounded-xl" />
        <h1 className="mb-2 text-5xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-sm text-muted-foreground">Cette page n'existe pas</p>
        <a href="/" className="px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors btn-press">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
