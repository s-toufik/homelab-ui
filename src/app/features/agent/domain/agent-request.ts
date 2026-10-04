export interface AgentRequestBody {
  message: string;
  model_name: string;
  request_id: string;
  auto_approve: boolean;
}
