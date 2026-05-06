export const PLUGIN_ID = "com.paca.example";

export interface HelloMessage {
  id: string;
  project_id: string;
  task_id?: string;
  name: string;
  message: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SuccessEnvelope<T> {
  success: boolean;
  data: T;
}
