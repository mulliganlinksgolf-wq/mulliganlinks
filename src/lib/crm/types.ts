// src/lib/crm/types.ts

export type CrmCourseStage =
  | 'lead' | 'contacted' | 'demo' | 'negotiating' | 'partner' | 'churned'

export type CrmOutingStatus =
  | 'lead' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'

export type CrmMemberTier = 'free' | 'eagle' | 'ace'

export type CrmMemberStatus = 'active' | 'lapsed' | 'churned'

export type CrmActivityType =
  | 'call' | 'email' | 'note' | 'meeting' | 'demo' | 'contract_sent'

export type CrmRecordType = 'course' | 'outing' | 'member'

export type CrmDocType = 'contract' | 'proposal' | 'other'

export type CrmAssignee = 'neil' | 'billy'

export type CrmLeadSource =
  | 'cold_email' | 'referral' | 'inbound' | 'event' | 'partner' | 'list' | 'other'

export const LEAD_SOURCE_LABELS: Record<CrmLeadSource, string> = {
  cold_email: 'Cold Email',
  referral: 'Referral',
  inbound: 'Inbound',
  event: 'Event',
  partner: 'Partner',
  list: 'List/Import',
  other: 'Other',
}

export interface CrmCourse {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  stage: CrmCourseStage
  assigned_to: CrmAssignee | null
  notes: string | null
  estimated_value: number | null
  lead_source: CrmLeadSource | null
  lost_reason: string | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface CrmOuting {
  id: string
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  event_date: string | null
  num_golfers: number | null
  preferred_course: string | null
  budget_estimate: number | null
  status: CrmOutingStatus
  assigned_to: CrmAssignee | null
  notes: string | null
  lead_source: CrmLeadSource | null
  lost_reason: string | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface CrmMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  membership_tier: CrmMemberTier
  home_course: string | null
  join_date: string | null
  lifetime_spend: number
  status: CrmMemberStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CrmActivityLog {
  id: string
  record_type: CrmRecordType
  record_id: string
  type: CrmActivityType
  body: string | null
  created_by: string
  created_at: string
  // email tracking (null on non-email activities)
  resend_email_id: string | null
  opened_at: string | null
  open_count: number
  from_email: string | null
  message_id: string | null
  in_reply_to: string | null
  email_html: string | null
}

export interface CrmEmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  record_type: CrmRecordType
  created_at: string
  updated_at: string
}

export interface CrmDocument {
  id: string
  record_type: CrmRecordType
  record_id: string
  name: string
  type: CrmDocType
  file_url: string | null
  generated_at: string
  created_by: string
}

export interface CrmDashboardStats {
  pipelineCourses: number
  activeOutings: number
  payingMembers: number
  pipelineValue: number
}

export interface CrmTask {
  id: string
  title: string
  notes: string | null
  record_type: CrmRecordType | null
  record_id: string | null
  assigned_to: CrmAssignee
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CrmCourseContact {
  id: string
  course_id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StaleLeadSummary {
  staleCourses: Array<{
    id: string
    name: string
    stage: CrmCourseStage
    last_activity_at: string
    assigned_to: CrmAssignee | null
  }>
  staleOutings: Array<{
    id: string
    contact_name: string
    status: CrmOutingStatus
    last_activity_at: string
    assigned_to: CrmAssignee | null
  }>
}
