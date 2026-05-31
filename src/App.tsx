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
import Personagens from "./pages/Personagens.tsx";
import Personagem from "./pages/Personagem.tsx";
import Lugares from "./pages/Lugares.tsx";
import Lugar from "./pages/Lugar.tsx";
import Livros from "./pages/Livros.tsx";
import Livro from "./pages/Livro.tsx";
import Timeline from "./pages/Timeline.tsx";
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
            <Route path="/personagens" element={<Personagens />} />
            <Route path="/personagem/:slug" element={<Personagem />} />
            <Route path="/lugares" element={<Lugares />} />
            <Route path="/lugar/:slug" element={<Lugar />} />
            <Route path="/livros" element={<Livros />} />
            <Route path="/livro/:slug" element={<Livro />} />
            <Route path="/timeline" element={<Timeline />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
