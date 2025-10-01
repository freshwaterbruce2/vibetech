import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Pages
import HomePage from '@/pages/HomePage'
import SearchPage from '@/pages/SearchPage'
import HotelDetailsPage from '@/pages/HotelDetailsPage'
import BookingPage from '@/pages/BookingPage'
import PaymentPage from '@/pages/PaymentPage'
import ProfilePage from '@/pages/ProfilePage'
import BookingConfirmationPage from '@/pages/BookingConfirmationPage'

// Layout
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Providers
import { AuthProvider } from '@/contexts/AuthContext'
import { BookingProvider } from '@/contexts/BookingContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Create a client with production-grade configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors except 408, 429
        const errorWithStatus = error as { statusCode?: number }
        if (errorWithStatus?.statusCode && errorWithStatus.statusCode >= 400 && errorWithStatus.statusCode < 500 &&
            errorWithStatus.statusCode !== 408 && errorWithStatus.statusCode !== 429) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BookingProvider>
              <Router>
              <div className="min-h-screen bg-background flex flex-col">
                <Navigation />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/hotel/:id" element={<HotelDetailsPage />} />
                    <Route path="/booking/:hotelId/:roomId" element={<BookingPage />} />
                    <Route path="/payment/:prebookId" element={<PaymentPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmationPage />} />
                  </Routes>
                </main>
                <Footer />
                <Toaster />
              </div>
              </Router>
            </BookingProvider>
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App