export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid";

export type UserStatus = "active" | "invited" | "suspended" | "deleted";
export type ShopStatus = "active" | "paused" | "disabled";

/** Display profile fields (sourced from canonical `profiles` table). */
export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

/** Canonical billing-aware profile (`public.profiles`). */
export type Profile = UserProfile & {
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_id: string | null;
  price_id: string | null;
  plan_id: "trial" | "starter" | "pro";
  trial_ends_at: string | null;
  scans_used_this_period: number;
  usage_period_start: string;
};

export type Shop = {
  id: string;
  owner_user_id: string;
  status: ShopStatus;
  name: string;
  platform: string;
  external_shop_id: string | null;
  timezone: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ShopMember = {
  shop_id: string;
  user_id: string;
  role: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

type TableDef<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Row>,
  Relationships extends unknown[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

type ShopMemberRelationships = [
  {
    foreignKeyName: "shop_members_shop_id_fkey";
    columns: ["shop_id"];
    isOneToOne: false;
    referencedRelation: "shops";
    referencedColumns: ["id"];
  },
];

export type ScanRuleRow = {
  id: string;
  name: string;
  severity: string;
  condition_type: string;
  condition_value: Record<string, unknown>;
  remediation_tip: string;
  active: boolean;
  blocks_publish: boolean;
  created_at: string;
  updated_at: string;
};

export type ListingScanRuleRow = {
  id: string;
  shop_id: string | null;
  name: string;
  severity: string;
  condition_type: string;
  condition_value: Record<string, unknown>;
  remediation_tip: string;
  active: boolean;
  blocks_publish: boolean;
  created_at: string;
  updated_at: string;
};

export type ViolationRow = {
  id: string;
  shop_id: string;
  listing_title: string | null;
  title: string;
  details: string | null;
  issue_category: string | null;
  severity: number;
  status: string;
  detected_at: string;
  appeal_deadline_at: string | null;
};

export type AppealRow = {
  id: string;
  shop_id: string;
  violation_id: string;
  status: string;
  issue_category: string | null;
  recommended_response: string | null;
  evidence_checklist: unknown;
  draft_message: string | null;
  deadline_at: string | null;
  supporting_docs_notes: string | null;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AppealDocumentRow = {
  id: string;
  appeal_id: string;
  file_name: string;
  file_url: string;
  status: string;
  mime_type: string | null;
  size_bytes: number | null;
  document_type: string | null;
  storage_path: string | null;
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, Partial<Profile> & { id: string }>;
      shops: TableDef<Shop>;
      shop_members: TableDef<ShopMember, Partial<ShopMember>, Partial<ShopMember>, ShopMemberRelationships>;
      scan_rules: TableDef<ScanRuleRow>;
      listing_scan_rules: TableDef<ListingScanRuleRow>;
      violations: TableDef<ViolationRow>;
      appeals: TableDef<AppealRow>;
      appeal_documents: TableDef<AppealDocumentRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_shop_member: { Args: { p_shop_id: string }; Returns: boolean };
      is_shop_admin: { Args: { p_shop_id: string }; Returns: boolean };
      user_shop_ids: { Args: Record<string, never>; Returns: string[] };
      increment_scan_usage: { Args: { p_user_id: string }; Returns: number };
      update_profile_billing: {
        Args: {
          p_user_id: string;
          p_subscription_status?: string | null;
          p_subscription_id?: string | null;
          p_price_id?: string | null;
          p_stripe_customer_id?: string | null;
          p_plan_id?: string | null;
          p_trial_ends_at?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
