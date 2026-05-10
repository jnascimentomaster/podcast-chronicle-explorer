import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Episodios from "./pages/Episodios.tsx";
import Episodio from "./pages/Episodio.tsx";
import Pesquisa from "./pages/Pesquisa.tsx";
import Temas from "./pages/Temas.tsx";
import TemaDominio from "./pages/TemaDominio.tsx";
import TemaSubtema from "./pages/TemaSubtema.tsx";
import SiteLayout from "./components/layout/SiteLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/episodios" element={<Episodios />} />
            <Route path="/episodio/:slug" element={<Episodio />} />
            <Route path="/pesquisa" element={<Pesquisa />} />
            <Route path="/temas" element={<Temas />} />
            <Route path="/temas/:dominioSlug" element={<TemaDominio />} />
            <Route path="/temas/:dominioSlug/:temaSlug" element={<TemaSubtema />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
