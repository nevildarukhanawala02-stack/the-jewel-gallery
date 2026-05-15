import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { CustomerAuthProvider } from "./contexts/CustomerAuthContext";

// Storefront Pages
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import CollectionsPage from "./pages/CollectionsPage";
import ProductPage from "./pages/ProductPage";
import CelebrityPage from "./pages/CelebrityPage";
import CelebrityProfilePage from "./pages/CelebrityProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import PoliciesPage from "./pages/PoliciesPage";
import OurStory from "./pages/OurStory";
import CartPage from "./pages/CartPage";
import ShippingPage from "./pages/ShippingPage";
import PaymentPage from "./pages/PaymentPage";
import ConfirmationPage from "./pages/ConfirmationPage";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import AdminSkuUpload from "./pages/AdminSkuUpload";
import AdminCelebrities from "./pages/AdminCelebrities";

// Fallback
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      {/* Storefront */}
      <Route path="/" component={Home} />
      <Route path="/collections" component={CollectionsPage} />
      <Route path="/category/:category" component={CategoryPage} />
      <Route path="/product/:slug" component={ProductPage} />
      <Route path="/celebrity" component={CelebrityPage} />
      <Route path="/celebrity/:slug" component={CelebrityProfilePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/policies" component={PoliciesPage} />
      <Route path="/our-story" component={OurStory} />
      <Route path="/cart" component={CartPage} />
      <Route path="/shipping" component={ShippingPage} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/confirmation" component={ConfirmationPage} />
      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/sku-upload" component={AdminSkuUpload} />
      <Route path="/admin/celebrities" component={AdminCelebrities} />
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <Toaster />
              <Router />
            </CartProvider>
          </CustomerAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
