import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import BlogPost from "@/pages/BlogPost";
import CategoryPage from "@/pages/CategoryPage";
import About from "@/pages/About";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post/:id" component={BlogPost} />
      <Route path="/tutorials" component={() => <CategoryPage />} />
      <Route path="/reviews" component={() => <CategoryPage />} />
      <Route path="/snippets" component={() => <CategoryPage />} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
