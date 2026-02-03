import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="relative">
          <h1 className="text-9xl font-bold text-primary/10">404</h1>
          <p className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-foreground">
            Page Not Found
          </p>
        </div>
        
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2 min-w-[140px]">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button variant="gradient" className="gap-2 min-w-[140px]">
              <Home className="w-4 h-4" />
              Home Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
