import { createAdminClient } from "./data/server";

export type LogAction = 
  | "status_change" 
  | "manual_entry" 
  | "note_updated" 
  | "details_updated"
  | "application_deleted";

interface CreateLogParams {
  admin_email: string;
  admin_id?: string;
  action_type: LogAction;
  target_id?: string;
  target_name?: string;
  old_value?: string;
  new_value?: string;
  details?: any;
}

export async function createAdminLog(params: CreateLogParams) {
  const admin = createAdminClient();
  try {
    const { error } = await admin
      .from("admin_activity_logs")
      .insert([{
        ...params,
        created_at: new Date().toISOString(),
      }]);
    
    if (error) {
      console.error("Error creating admin log:", error);
    }
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}
