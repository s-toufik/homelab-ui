/** Wire shape the backend expects (see AgentRequestSchema). */
export interface AgentRequestBody {
  message: string;
  model_name: string;
  request_id: string;
}
