# AGENTS.md - Hotel Booking Platform

This file extends the web-apps AGENTS.md with hotel booking system specific patterns and requirements.

## Project Overview

Enterprise-grade hotel booking platform with real-time availability, payment processing, and reservation management. Must handle high-concurrency booking scenarios and provide excellent user experience.

## Booking System Specific Requirements

### Core Booking Flow Architecture
```typescript
interface BookingFlow {
  search: SearchCriteria;
  selection: HotelSelection;
  guestDetails: GuestInformation;
  payment: PaymentDetails;
  confirmation: BookingConfirmation;
}

// Each step must be atomic and recoverable
class BookingManager {
  async processBooking(flow: BookingFlow): Promise<BookingResult> {
    const transaction = await this.beginTransaction();

    try {
      // 1. Validate availability (real-time check)
      const availability = await this.validateAvailability(flow.selection);
      if (!availability.available) {
        throw new BookingError('Room no longer available');
      }

      // 2. Hold reservation (time-limited)
      const hold = await this.holdReservation(flow.selection, 900); // 15 min hold

      // 3. Process payment
      const payment = await this.processPayment(flow.payment);

      // 4. Confirm booking
      const booking = await this.confirmBooking(flow, payment.id);

      await transaction.commit();
      return booking;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

### Real-Time Availability System
```typescript
interface AvailabilityManager {
  // WebSocket for real-time updates
  subscribeToAvailability(hotelId: string, dateRange: DateRange): void;

  // Pessimistic locking for booking attempts
  holdRoom(roomId: string, duration: number): Promise<RoomHold>;

  // Automatic release of expired holds
  cleanupExpiredHolds(): void;
}

class RealTimeAvailability {
  private wsConnection: WebSocket;
  private holdManager: HoldManager;

  async checkAvailability(criteria: SearchCriteria): Promise<AvailabilityResult> {
    // Check cache first (1-2 second stale data acceptable)
    const cached = await this.availabilityCache.get(criteria);
    if (cached && !this.isStale(cached, 2000)) {
      return cached;
    }

    // Real-time availability check
    const availability = await this.fetchAvailability(criteria);
    await this.availabilityCache.set(criteria, availability, 30); // 30s cache

    return availability;
  }
}
```

### Payment Integration Patterns
```typescript
interface PaymentProcessor {
  // PCI DSS compliant payment handling
  processPayment(details: PaymentDetails): Promise<PaymentResult>;

  // Refund processing
  processRefund(bookingId: string, amount: number): Promise<RefundResult>;

  // Payment validation
  validatePaymentMethod(method: PaymentMethod): Promise<ValidationResult>;
}

class SecurePaymentHandler {
  async processHotelPayment(booking: BookingDetails, payment: PaymentDetails): Promise<PaymentResult> {
    // Validate payment amount matches booking total
    const calculatedTotal = await this.calculateBookingTotal(booking);
    if (Math.abs(payment.amount - calculatedTotal) > 0.01) {
      throw new PaymentError('Payment amount mismatch');
    }

    // Tokenize sensitive data (never store card details)
    const tokenizedPayment = await this.tokenizePayment(payment);

    // Process with fraud detection
    const fraudCheck = await this.runFraudDetection(booking, tokenizedPayment);
    if (!fraudCheck.passed) {
      throw new PaymentError('Payment failed fraud detection');
    }

    // Execute payment
    return await this.executePayment(tokenizedPayment);
  }
}
```

## User Experience Requirements

### Search & Filter Performance
```typescript
// Debounced search with caching
const useHotelSearch = () => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>();
  const debouncedCriteria = useDebounce(searchCriteria, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ['hotel-search', debouncedCriteria],
    queryFn: () => searchHotels(debouncedCriteria),
    enabled: !!debouncedCriteria,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });

  return { hotels: data, loading: isLoading, error };
};

// Progressive loading for better UX
const HotelSearchResults = () => {
  const { hotels, loading } = useHotelSearch();

  if (loading) {
    return <SearchResultsSkeleton />;
  }

  return (
    <VirtualizedList
      items={hotels}
      renderItem={({ item }) => <HotelCard hotel={item} />}
      overscan={5}
    />
  );
};
```

### Booking Form Validation
```typescript
const bookingFormSchema = z.object({
  checkIn: z.date().min(new Date(), 'Check-in must be in the future'),
  checkOut: z.date(),
  guests: z.object({
    adults: z.number().min(1).max(10),
    children: z.number().min(0).max(8),
    rooms: z.number().min(1).max(5),
  }),
  guestDetails: z.array(z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/),
  })),
  specialRequests: z.string().max(500).optional(),
}).refine(
  (data) => data.checkOut > data.checkIn,
  {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  }
);
```

### Mobile-First Responsive Design
```typescript
// Responsive booking flow
const BookingWizard = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'search', title: 'Search', component: SearchStep },
    { id: 'select', title: 'Select Room', component: SelectionStep },
    { id: 'details', title: 'Guest Details', component: DetailsStep },
    { id: 'payment', title: 'Payment', component: PaymentStep },
    { id: 'confirm', title: 'Confirmation', component: ConfirmationStep },
  ];

  return (
    <BookingLayout>
      {isMobile ? (
        <MobileStepperNav steps={steps} currentStep={currentStep} />
      ) : (
        <DesktopProgressIndicator steps={steps} currentStep={currentStep} />
      )}

      <AnimatePresence mode="wait">
        <StepContent
          key={currentStep}
          step={steps[currentStep]}
          onNext={() => setCurrentStep(s => s + 1)}
          onPrev={() => setCurrentStep(s => s - 1)}
        />
      </AnimatePresence>
    </BookingLayout>
  );
};
```

## Performance Requirements

### Hotel Booking Specific Metrics
- **Search Results**: <500ms for initial results
- **Availability Check**: <200ms for real-time updates
- **Booking Completion**: <2s for full booking flow
- **Payment Processing**: <5s end-to-end
- **Image Loading**: Progressive with lazy loading, <1s for hero images

### Caching Strategy
```typescript
class BookingCacheManager {
  // Hotel data (relatively static)
  private hotelCache = new Map<string, Hotel>();

  // Availability data (highly dynamic)
  private availabilityCache = new LRUCache<string, AvailabilityData>({
    max: 1000,
    ttl: 30000, // 30 seconds
  });

  // Search results (user-specific)
  private searchCache = new LRUCache<string, SearchResult>({
    max: 100,
    ttl: 300000, // 5 minutes
  });

  async getHotelWithAvailability(hotelId: string, dateRange: DateRange): Promise<HotelWithAvailability> {
    // Get hotel data (cache-friendly)
    const hotel = await this.getCachedHotel(hotelId);

    // Get real-time availability
    const availability = await this.getAvailability(hotelId, dateRange);

    return { ...hotel, availability };
  }
}
```

## Testing Requirements

### Booking Flow Testing
```typescript
// E2E booking flow test
test.describe('Complete Booking Flow', () => {
  test('should complete a full booking successfully', async ({ page }) => {
    // Search for hotels
    await page.goto('/search');
    await page.fill('[data-testid="destination"]', 'New York');
    await page.click('[data-testid="search-button"]');

    // Wait for results and verify
    await expect(page.locator('[data-testid="hotel-results"]')).toBeVisible();

    // Select a hotel
    await page.click('[data-testid="hotel-card"]:first-child [data-testid="book-button"]');

    // Fill guest details
    await page.fill('[data-testid="guest-name"]', 'John Doe');
    await page.fill('[data-testid="guest-email"]', 'john@example.com');

    // Process payment (use test payment method)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');

    // Complete booking
    await page.click('[data-testid="complete-booking"]');

    // Verify confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-id"]')).toContainText(/^BK\d+$/);
  });

  test('should handle booking conflicts gracefully', async ({ page }) => {
    // Test scenario where room becomes unavailable during booking
    // Should show appropriate error and redirect to alternative options
  });
});
```

### Load Testing for Concurrency
```typescript
// Simulate concurrent booking attempts
describe('Concurrent Booking Handling', () => {
  it('should handle multiple users booking the same room', async () => {
    const roomId = 'room-123';
    const bookingPromises = Array.from({ length: 10 }, (_, i) =>
      attemptBooking(roomId, `user-${i}`)
    );

    const results = await Promise.allSettled(bookingPromises);

    // Only one booking should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(9);

    // Failed bookings should have appropriate error messages
    failed.forEach(result => {
      expect(result.reason.message).toContain('Room no longer available');
    });
  });
});
```

## Security Requirements

### Data Protection
```typescript
class BookingDataProtection {
  // PCI DSS compliance for payment data
  sanitizePaymentData(data: PaymentDetails): SanitizedPaymentData {
    return {
      ...data,
      cardNumber: this.maskCardNumber(data.cardNumber),
      cvv: undefined, // Never store CVV
    };
  }

  // GDPR compliance for guest data
  anonymizeGuestData(guestId: string): Promise<void> {
    // Implement right to be forgotten
    return this.replacePersonalData(guestId, {
      firstName: 'REDACTED',
      lastName: 'REDACTED',
      email: 'redacted@example.com',
      phone: 'REDACTED',
    });
  }

  // Audit logging for compliance
  logBookingActivity(activity: BookingActivity): void {
    this.auditLogger.log({
      timestamp: new Date(),
      userId: activity.userId,
      action: activity.action,
      resource: activity.resource,
      ip: activity.ipAddress,
      userAgent: activity.userAgent,
    });
  }
}
```

## Integration Points

### Hotel Management System
```typescript
interface HotelManagementIntegration {
  // Sync availability in real-time
  syncAvailability(hotelId: string): Promise<void>;

  // Push booking confirmations
  notifyBookingConfirmed(booking: Booking): Promise<void>;

  // Handle cancellations
  processCancellation(bookingId: string): Promise<CancellationResult>;
}
```

### Customer Communication
```typescript
class BookingCommunication {
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    // Email confirmation
    await this.emailService.send({
      to: booking.guestEmail,
      template: 'booking-confirmation',
      data: booking,
    });

    // SMS confirmation (if phone provided)
    if (booking.guestPhone) {
      await this.smsService.send({
        to: booking.guestPhone,
        message: `Booking confirmed! Reference: ${booking.id}`,
      });
    }
  }

  async sendPreArrivalReminder(booking: Booking): Promise<void> {
    // 24 hours before check-in
    const reminderDate = new Date(booking.checkIn);
    reminderDate.setDate(reminderDate.getDate() - 1);

    await this.scheduleMessage(reminderDate, {
      type: 'email',
      template: 'pre-arrival-reminder',
      recipient: booking.guestEmail,
      data: booking,
    });
  }
}
```

Remember: This is a **real-money booking platform**. Every component must be enterprise-grade with proper error handling, security, and user experience. No shortcuts or MVP implementations in production.