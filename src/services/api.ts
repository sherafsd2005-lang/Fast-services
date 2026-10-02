import {
  User,
  WorkerProfile,
  Category,
  Booking,
  CustomJob,
  JobOffer,
  PaymentMethod,
  Payment,
  WorkerPayout,
  Review,
  ChatMessage,
  AppNotification,
  Dispute,
  Refund,
  HeroPoster,
  AppSettings,
  AuditLog
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('firststep_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { identifier: string; password: string }) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  adminLogin: (data: { identifier: string; password: string }) => request<{ token: string; user: User }>('/auth/admin-login', { method: 'POST', body: JSON.stringify(data) }),
  adminChangePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request<{ success: boolean; message: string; token: string }>('/admin/change-password', { method: 'POST', body: JSON.stringify(data) }),
  adminRecoverPassword: (data: { identifier: string; recoveryKey: string; newPassword: string; confirmPassword: string }) =>
    request<{ success: boolean; message: string; token: string }>('/admin/recover-password', { method: 'POST', body: JSON.stringify(data) }),
  changeMyPassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-my-password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<{ user: User; workerProfile?: WorkerProfile }>('/auth/me'),

  // Categories & Services
  getCategories: () => request<Category[]>('/categories'),
  adminAddCategory: (data: Partial<Category>) => request<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateCategory: (id: string, data: Partial<Category>) => request<Category>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteCategory: (id: string) => request<{ success: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Workers
  getWorkers: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<WorkerProfile[]>(`/workers${qs ? `?${qs}` : ''}`);
  },
  getWorker: (id: string) => request<WorkerProfile>(`/workers/${id}`),
  registerWorker: (data: any) => request<{ token: string; user: User; worker: WorkerProfile; message: string }>('/workers/register', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkerAvailability: (id: string, data: { availability: string; weeklyOffDays?: string[] }) =>
    request<{ success: boolean; worker: WorkerProfile }>(`/workers/${id}/availability`, { method: 'PUT', body: JSON.stringify(data) }),
  updateWorkerProfile: (id: string, data: Partial<WorkerProfile>) =>
    request<{ success: boolean; worker: WorkerProfile }>(`/workers/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
  updateWorkerProfilePicture: (id: string, avatarUrl: string) =>
    request<{ success: boolean; avatarUrl: string; worker: WorkerProfile }>(`/workers/${id}/profile-picture`, { method: 'PUT', body: JSON.stringify({ avatarUrl }) }),
  workerReuploadDocuments: (id: string, data: { cnicFrontUrl?: string; cnicBackUrl?: string; avatarUrl?: string }) =>
    request<{ success: boolean; worker: WorkerProfile; message: string }>(`/workers/${id}/reupload-documents`, { method: 'PUT', body: JSON.stringify(data) }),
  getWorkerEarnings: (id: string) =>
    request<{
      totalEarnings: number;
      releasedEarnings: number;
      pendingEarnings: number;
      totalCommissionPaid: number;
      bonusesEarned: number;
      payoutHistory: WorkerPayout[];
    }>(`/workers/${id}/earnings`),

  // Admin Worker Management
  adminAddWorker: (data: any) => request<{ user: User; worker: WorkerProfile }>('/admin/workers', { method: 'POST', body: JSON.stringify(data) }),
  adminVerifyWorker: (id: string, verificationStatus: string, note?: string) =>
    request<{ success: boolean; worker: WorkerProfile }>(`/admin/workers/${id}/verify`, { method: 'PUT', body: JSON.stringify({ verificationStatus, note }) }),
  adminVerifyWorkerAction: (id: string, action: string, note?: string) =>
    request<{ success: boolean; worker: WorkerProfile }>(`/admin/workers/${id}/verify`, { method: 'PUT', body: JSON.stringify({ action, note }) }),
  adminReviewCnic: (id: string, cnicStatus: string, rejectReason?: string) =>
    request<{ success: boolean; worker: WorkerProfile }>(`/admin/workers/${id}/cnic`, { method: 'PUT', body: JSON.stringify({ cnicStatus, rejectReason }) }),
  adminGetWorkerDocuments: (id: string) =>
    request<{ workerId: string; workerName: string; cnicStatus: string; cnicFrontUrl?: string; cnicBackUrl?: string; cnicRejectReason?: string }>(`/admin/workers/${id}/documents`),

  // Bookings
  getBookings: () => request<Booking[]>('/bookings'),
  createBooking: (data: Partial<Booking>) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBookingStatus: (id: string, status: string, reason?: string) =>
    request<{ success: boolean; booking: Booking }>(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
  requestAdditionalCharge: (bookingId: string, data: { reason: string; amount: number }) =>
    request<{ success: boolean; charge: any; booking: Booking }>(`/bookings/${bookingId}/additional-charge`, { method: 'POST', body: JSON.stringify(data) }),
  respondAdditionalCharge: (bookingId: string, chargeId: string, status: 'approved' | 'rejected') =>
    request<{ success: boolean; charge: any; booking: Booking }>(`/bookings/${bookingId}/additional-charge/${chargeId}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Custom Jobs & Counter-Offers
  getCustomJobs: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<CustomJob[]>(`/custom-jobs${qs ? `?${qs}` : ''}`);
  },
  createCustomJob: (data: Partial<CustomJob>) => request<CustomJob>('/custom-jobs', { method: 'POST', body: JSON.stringify(data) }),
  getJobOffers: (jobId: string) => request<JobOffer[]>(`/custom-jobs/${jobId}/offers`),
  submitJobOffer: (jobId: string, data: { proposedPrice: number; message: string; estimatedArrival: string }) =>
    request<JobOffer>(`/custom-jobs/${jobId}/offers`, { method: 'POST', body: JSON.stringify(data) }),
  respondJobOffer: (jobId: string, offerId: string, status: string, counterPrice?: number) =>
    request<{ success: boolean; offer: JobOffer; job: CustomJob }>(`/custom-jobs/${jobId}/offers/${offerId}/status`, { method: 'PUT', body: JSON.stringify({ status, counterPrice }) }),

  // Payments & Settings
  getPaymentMethods: () => request<PaymentMethod[]>('/payment-methods'),
  submitPayment: (data: { bookingId: string; amount: number; paymentMethodId: string; transactionId: string; screenshotUrl?: string; paymentDate?: string }) =>
    request<{ success: boolean; payment: Payment; message: string }>('/payments/submit', { method: 'POST', body: JSON.stringify(data) }),
  adminGetPayments: () => request<Payment[]>('/admin/payments'),
  adminVerifyPayment: (id: string, status: 'confirmed' | 'rejected', rejectionReason?: string) =>
    request<{ success: boolean; payment: Payment }>(`/admin/payments/${id}/verify`, { method: 'PUT', body: JSON.stringify({ status, rejectionReason }) }),
  adminGetPaymentSettings: () => request<PaymentMethod[]>('/admin/payment-settings'),
  adminUpdatePaymentMethod: (id: string, data: Partial<PaymentMethod>) =>
    request<PaymentMethod>(`/admin/payment-settings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminAddPaymentMethod: (data: Partial<PaymentMethod>) =>
    request<PaymentMethod>('/admin/payment-settings', { method: 'POST', body: JSON.stringify(data) }),

  // Payouts
  adminGetPayouts: () => request<WorkerPayout[]>('/admin/payouts'),
  adminReleasePayout: (id: string) => request<{ success: boolean; payout: WorkerPayout }>(`/admin/payouts/${id}/release`, { method: 'PUT' }),
  adminHoldPayout: (id: string, reason: string) => request<{ success: boolean; payout: WorkerPayout }>(`/admin/payouts/${id}/hold`, { method: 'PUT', body: JSON.stringify({ reason }) }),

  // Reviews & Favorites
  getReviews: (workerId?: string) => request<Review[]>(`/reviews${workerId ? `?workerId=${workerId}` : ''}`),
  submitReview: (data: { bookingId: string; rating: number; comment: string }) =>
    request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getFavorites: () => request<WorkerProfile[]>('/favorites'),
  toggleFavorite: (workerId: string) => request<{ favorited: boolean }>('/favorites/toggle', { method: 'POST', body: JSON.stringify({ workerId }) }),

  // Chat
  getMessages: (params: { conversationId?: string; bookingId?: string; jobId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<ChatMessage[]>(`/chat/messages?${qs}`);
  },
  sendMessage: (data: { conversationId?: string; bookingId?: string; jobId?: string; recipientId?: string; text: string; attachmentUrl?: string }) =>
    request<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request<AppNotification[]>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),

  // Disputes & Refunds
  fileDispute: (data: { bookingId: string; issueType: string; description: string }) =>
    request<Dispute>('/disputes', { method: 'POST', body: JSON.stringify(data) }),
  getDisputes: () => request<Dispute[]>('/disputes'),
  adminResolveDispute: (id: string, data: { status: string; resolution: string; adminNotes?: string }) =>
    request<{ success: boolean; dispute: Dispute }>(`/admin/disputes/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
  requestRefund: (data: { bookingId: string; amount?: number; type?: string; reason: string }) =>
    request<Refund>('/refunds', { method: 'POST', body: JSON.stringify(data) }),
  getRefunds: () => request<Refund[]>('/refunds'),
  adminApproveRefund: (id: string, data: { status: string; adminNotes?: string }) =>
    request<{ success: boolean; refund: Refund }>(`/admin/refunds/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),

  // Posters
  getPosters: () => request<HeroPoster[]>('/posters'),
  adminGetPosters: () => request<HeroPoster[]>('/admin/posters'),
  adminCreatePoster: (data: Partial<HeroPoster>) => request<HeroPoster>('/admin/posters', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdatePoster: (id: string, data: Partial<HeroPoster>) => request<HeroPoster>(`/admin/posters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeletePoster: (id: string) => request<{ success: boolean }>(`/admin/posters/${id}`, { method: 'DELETE' }),

  // Stats & Settings
  adminGetStats: () =>
    request<{
      customersCount: number;
      workersCount: number;
      activeBookings: number;
      completedJobs: number;
      totalRevenue: number;
      pendingPayments: number;
      pendingPayouts: number;
      reviewsCount: number;
    }>('/admin/stats'),
  adminGetNeedsAttention: () =>
    request<{
      pendingWorkers: WorkerProfile[];
      pendingCnics: WorkerProfile[];
      pendingPayments: Payment[];
      openDisputes: Dispute[];
      pendingRefunds: Refund[];
    }>('/admin/needs-attention'),
  adminGetAuditLogs: () => request<AuditLog[]>('/admin/audit-logs'),
  getSettings: () => request<AppSettings>('/settings'),
  adminUpdateSettings: (data: Partial<AppSettings>) => request<AppSettings>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
};
