import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AboutPage } from './pages/AboutPage';
import { AuthActionPage } from './pages/AuthActionPage';
import { BuyerDashboardPage } from './pages/BuyerDashboardPage';
import { FavouritesPage } from './pages/FavouritesPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { LoginPage } from './pages/LoginPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MyEnquiriesPage } from './pages/MyEnquiriesPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SellItemPage } from './pages/SellItemPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
              <Route path="/about" element={<AboutPage />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/action" element={<AuthActionPage />} />

              {/* Protected Marketplace & Dashboard Routes */}
              <Route
                path="/sell"
                element={
                  <ProtectedRoute>
                    <SellItemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-listing/:id"
                element={
                  <ProtectedRoute>
                    <SellItemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <BuyerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/buyer-dashboard"
                element={
                  <ProtectedRoute>
                    <BuyerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller-dashboard"
                element={
                  <ProtectedRoute>
                    <SellerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-listings"
                element={
                  <ProtectedRoute>
                    <MyListingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enquiries"
                element={
                  <ProtectedRoute>
                    <MyEnquiriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favourites"
                element={
                  <ProtectedRoute>
                    <FavouritesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
