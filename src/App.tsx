
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MouseEffect from "./components/MouseEffect";

const queryClient = new QueryClient();

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Delay rendering of main content to ensure all dependencies are properly loaded
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300); // Increased timeout to ensure Leaflet is properly loaded
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="animate-fade-in">
          <MouseEffect />
          <Toaster />
          <Sonner />
          {isLoaded ? (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          ) : (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="spinner mb-4"></div>
                <p>Loading application...</p>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
