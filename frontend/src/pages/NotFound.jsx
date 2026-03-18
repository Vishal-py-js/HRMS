import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <p className="text-7xl font-display font-700 text-slate-100 select-none">404</p>
      <h1 className="mt-2 text-lg font-semibold text-slate-700">Page not found</h1>
      <p className="mt-1 text-sm text-slate-400 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="primary" size="sm">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
