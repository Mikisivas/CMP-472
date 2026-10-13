// Mirrors the CAPQA backend response schemas (app/schemas/responses/*.py).
export type RoleCode = "ADMIN" | "DIRECTOR" | "ACADEMIC-OFFICER" | "QUALITY-INSPECTOR" | "VIEWER";
export type AccountStatus = "PENDING" | "ACTIVE" | "DISABLED";
export type DispatchPriority = "HIGH" | "MEDIUM" | "LOW";
export type DispatchTrackingStatus = "DRAFT" | "PENDING" | "FORWARDED" | "REVIEWED" | "APPROVED" | "REJECTED";
export type FacilityStatus = "SUITABLE" | "FULL" | "OVERCROWDED";
export type AllocationPurpose = "CLASS" | "EXAM" | "EVENT";
export type AuditResultStatus = "SUITABLE" | "NEEDS_ATTENTION" | "NOT_SUITABLE";
export type LifecycleStatus = "DRAFT" | "ACTIVE" | "FINALISED";
export type AccreditationStatus = "FULL" | "INTERIM" | "DENIED";
export type BenchmarkSource = "FILE" | "API" | "MANUAL";
export type EvaluationSource = "STUDENT" | "PEER" | "MANAGEMENT";
export type InvoiceStatus = "UNPAID" | "PAID" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED";
export type ReportType = "DISPATCH" | "CLASSROOM_USAGE" | "DEPARTMENTAL_AUDIT" | "STAFF_EVALUATION" | "PAYMENT_HISTORY";
export type ExportFormat = "PDF" | "EXCEL";
export type NotificationType = "PENDING_APPROVAL" | "ASSIGNED_TASK" | "DEADLINE" | "SYSTEM_UPDATE";

export interface Page<T> { items: T[]; total: number; offset: number; limit: number }
export interface Message { message: string }

export interface User {
  id: string; full_name: string; username: string; email: string; department_id: number | null;
  account_status: AccountStatus; role: RoleCode; last_login_at: string | null; created_at: string;
}
export interface TokenPair { access_token: string; refresh_token: string; token_type: string; expires_in: number }
export interface PasswordResetRequested { message: string; development_token: string | null }

export interface Dispatch {
  id: string; reference_number: string; sender: string; subject: string; date_received: string;
  priority: DispatchPriority; tracking_status: DispatchTrackingStatus; workflow_status: string;
  created_by: string; assigned_to: string | null; digital_stamp: string | null; stamped_at: string | null;
  approved_by: string | null; approved_at: string | null; rejection_reason: string | null;
  created_at: string; updated_at: string;
}
export interface Attachment {
  id: string; record_id: string; original_name: string; media_type: string; size_bytes: number;
  sha256_digest: string; created_at: string;
}

export interface Classroom {
  id: number; name: string; building: string | null; department_id: number | null; capacity: number;
  status: FacilityStatus; created_at: string;
}
export interface Allocation {
  id: string; classroom_id: number; course_id: number | null; purpose: AllocationPurpose;
  student_count: number; level: number | null; start_time: string; end_time: string;
  allocated_by: string; created_at: string;
}
export interface HallSuggestion { classroom_id: number; name: string; building: string | null; capacity: number }
export interface ExamHallAudit {
  id: string; classroom_id: number; inspector_id: string; ventilation: number; lighting: number;
  seating: number; audio_system: number; cleanliness: number; comments: string | null;
  result_status: AuditResultStatus; lifecycle_status: LifecycleStatus; finalised_at: string | null; created_at: string;
}

export interface Department { id: number; name: string; faculty: string; created_at: string }
export interface Staff { id: string; department_id: number; user_id: string | null; full_name: string; staff_rank: string | null; is_active: boolean }
export interface Course { id: number; department_id: number; code: string; title: string; level: number; accreditation_status: AccreditationStatus; accreditation_updated_at: string | null }
export interface Benchmark { id: number; discipline: string; max_students_per_staff: string; source: BenchmarkSource; effective_year: number }
export interface QualityScore { id: string; department_id: number; inspector_id: string; facility_type: string; session: string; score: number; remarks: string | null; created_at: string }
export interface DepartmentStats { id: number; department_id: number; session: string; professor_count: number | null; staff_count: number | null; student_count: number | null }
export interface DepartmentCompliance {
  department_id: number; department_name: string; session: string; staff_count: number | null; student_count: number | null;
  students_per_staff: number | null; nuc_max_students_per_staff: number | null; staffing_compliant: boolean | null;
  departmental_quality_score: number | null; data_complete: boolean;
}

export interface StaffEvaluation {
  id: string; staff_id: string; evaluator_id: string; source: EvaluationSource; session: string; semester: number;
  teaching_quality: number; student_engagement: number; assessment_quality: number; comments: string | null; created_at: string;
}
export interface EvaluationTrend {
  session: string; semester: number; teaching_quality: number; student_engagement: number; assessment_quality: number; evaluation_count: number;
}

export interface Invoice { id: string; user_id: string; description: string; amount: string; currency: string; status: InvoiceStatus; created_at: string }
export interface Payment {
  id: string; invoice_id: string; provider: string; provider_reference: string; amount: string; status: PaymentStatus;
  paid_at: string | null; verified_at: string | null; created_at: string;
}
export interface Receipt { id: string; payment_id: string; receipt_number: string; file_path: string | null; created_at: string }
export interface PaymentVerification { payment: Payment; receipt: Receipt | null }

export interface Report {
  id: string; report_type: ReportType; department_id: number | null; session: string | null;
  filters_json: Record<string, unknown> | null; export_format: ExportFormat; is_finalised: boolean;
  generated_by: string; created_at: string; download_available: boolean;
}
export interface Notification { id: string; notification_type: NotificationType; message: string; link: string | null; is_read: boolean; read_at: string | null; created_at: string }
export interface AuditLog {
  id: number; user_id: string | null; action: string; resource_type: string | null; resource_id: string | null;
  old_value: Record<string, unknown> | null; new_value: Record<string, unknown> | null; ip_address: string | null;
  request_id: string | null; created_at: string;
}
export interface MetricCount { label: string; value: number }
export interface Dashboard {
  pending_tasks: number; unread_notifications: number; mail_status: MetricCount[]; classroom_status: MetricCount[];
  accreditation_status: MetricCount[];
  quality_scores: { department_id: number; department_name: string; score: number }[];
  evaluation_trends: { session: string; semester: number; average_rating: number }[];
}
