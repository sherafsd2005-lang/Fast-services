export type UserRole = 'customer' | 'worker' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  mobile: string;
  email?: string;
  city: string;
  area: string;
  address?: string;
  avatarUrl?: string;
  createdAt: string;
  status: 'active' | 'suspended';
}

export interface WorkerProfile {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  city: string;
  area: string;
  services: string[];
  categories: string[];
  experience: 'Less than 1 year' | '1–3 years' | '3–5 years' | '5–10 years' | '10+ years';
  startingPrice: number | null;
  priceType: 'fixed' | 'discuss';
  visitCharge: number;
  about: string;
  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected' | 'reupload_required' | 'suspended';
  verificationNote?: string;
  availability: 'available' | 'busy' | 'off_today' | 'offline';
  weeklyOffDays?: string[];
  vacationDates?: { start: string; end: string };
  avatarUrl?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  cnicStatus: 'pending' | 'under_review' | 'approved' | 'rejected' | 'reupload_required';
  cnicRejectReason?: string;
  portfolio: { id: string; title: string; imageUrl: string }[];
  customCommissionRate?: number; // Override if any
  badges: string[];
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  nameUrdu: string;
  basePrice?: number;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  nameUrdu: string;
  icon: string;
  description: string;
  order: number;
  isActive: boolean;
  services: ServiceItem[];
}

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'payment_pending'
  | 'payment_submitted'
  | 'payment_verified'
  | 'in_progress'
  | 'completed'
  | 'customer_confirmed'
  | 'payout_released'
  | 'cancelled';

export interface AdditionalCharge {
  id: string;
  reason: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  workerId: string;
  workerName: string;
  workerMobile: string;
  serviceName: string;
  categoryName: string;
  bookingDate: string;
  bookingTime: string;
  city: string;
  area: string;
  address: string;
  description: string;
  photos: string[];
  status: BookingStatus;
  totalAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  workerPayoutAmount: number;
  additionalCharges: AdditionalCharge[];
  paymentId?: string;
  isPaid: boolean;
  customerConfirmedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CustomJob {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  title: string;
  categoryName: string;
  serviceName: string;
  description: string;
  photos: string[];
  city: string;
  area: string;
  address: string;
  date: string;
  urgency: 'low' | 'normal' | 'urgent';
  budget: number;
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  offersCount: number;
  selectedWorkerId?: string;
  bookingId?: string;
  createdAt: string;
}

export interface JobOffer {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerAvatar?: string;
  workerRating: number;
  workerCompletedJobs: number;
  proposedPrice: number;
  message: string;
  estimatedArrival: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn' | 'expired';
  counterPrice?: number;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string; // e.g. "Meezan Bank", "Raast", "Easypaisa"
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  easypaisaNumber?: string;
  raastId?: string;
  instructions: string;
  isActive: boolean;
  order: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  transactionId: string;
  screenshotUrl?: string;
  paymentDate: string;
  status: 'pending' | 'submitted' | 'under_verification' | 'confirmed' | 'rejected';
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedByAdminId?: string;
  createdAt: string;
}

export interface WorkerPayout {
  id: string;
  workerId: string;
  workerName: string;
  bookingId: string;
  customerPayment: number;
  commission: number;
  bonus: number;
  adjustments: number;
  netPayout: number;
  status: 'pending' | 'released' | 'held' | 'cancelled';
  holdReason?: string;
  releasedAt?: string;
  createdAt: string;
}

export interface PerformanceBonusRule {
  id: string;
  title: string;
  description: string;
  bonusAmount: number;
  criteria: 'rating_above' | 'completed_jobs_above' | 'zero_cancellations' | 'repeat_customers';
  threshold: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  workerId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  customerId: string;
  workerId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  bookingId?: string;
  jobId?: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  text: string;
  attachmentUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'offer' | 'job' | 'system' | 'dispute' | 'payout';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  raisedByUserId: string;
  raisedByName: string;
  raisedByRole: 'customer' | 'worker';
  issueType: 'worker_problem' | 'payment_problem' | 'booking_problem' | 'service_problem' | 'refund_problem' | 'customer_problem';
  description: string;
  status: 'open' | 'under_review' | 'waiting' | 'resolved' | 'closed';
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Refund {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  originalAmount: number;
  refundAmount: number;
  type: 'full' | 'partial';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface HeroPoster {
  id: string;
  title: string;
  titleUrdu: string;
  subtitle: string;
  subtitleUrdu: string;
  category: string;
  serviceName: string;
  imageUrl: string;
  buttonText: string;
  buttonTextUrdu: string;
  displayOrder: number;
  durationSeconds: number;
  isActive: boolean;
}

export interface AppSettings {
  siteName: string;
  contactNumber: string;
  supportEmail: string;
  defaultCommissionPercent: number;
  currency: string;
  heroPostersEnabled: boolean;
  announcementText?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}
