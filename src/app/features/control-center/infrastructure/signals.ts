const ROOT_FS = 'mountpoint="/",fstype!~"tmpfs|overlay"';
const NET = 'device!~"lo|veth.*|cni0|flannel.*|k3s0|tailscale.*"';

export const GAUGES = {
  cpu: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))',
  memory: '100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)',
  disk: `100 * (1 - node_filesystem_avail_bytes{${ROOT_FS}} / node_filesystem_size_bytes{${ROOT_FS}})`,
  temperature:
    'max(node_hwmon_temp_celsius * on(chip, sensor) group_left(label) node_hwmon_sensor_label{label=~"Package.*|Tctl|Tdie"})',
} as const;

export const STATS = {
  targetsDown: 'count(up == 0) or vector(0)',
  targets: 'count(up)',
  received: `sum(rate(node_network_receive_bytes_total{${NET}}[5m]))`,
  sent: `sum(rate(node_network_transmit_bytes_total{${NET}}[5m]))`,
  memoryTotal: 'node_memory_MemTotal_bytes',
  diskFree: `node_filesystem_avail_bytes{${ROOT_FS}}`,
  uptime: 'time() - node_boot_time_seconds',
  postgresUp: 'max(cnpg_collector_up)',
  postgresSize: 'sum(cnpg_pg_database_size_bytes)',
  mongoUp: 'max(mongodb_up)',
  kafkaBrokers: 'max(kafka_brokers)',
  kafkaIn: 'sum(rate(kafka_topic_partition_current_offset{topic!~"__.*"}[5m]))',
  kafkaLag: 'sum(kafka_consumergroup_lag) or vector(0)',
  tokensPerSecond:
    'sum(rate(llamacpp:tokens_predicted_total[5m])) / sum(rate(llamacpp:tokens_predicted_seconds_total[5m]))',
  llmRequests: 'sum(llamacpp:requests_processing) or vector(0)',
} as const;

export const FIRING_ALERTS = 'ALERTS{alertstate="firing"}';
export const TOP_MEMORY =
  'topk(6, sum by (container) (container_memory_working_set_bytes{namespace="homelab", container!="", container!="POD"}))';
export const TOP_CPU =
  'topk(6, sum by (container) (rate(container_cpu_usage_seconds_total{namespace="homelab", container!="", container!="POD"}[5m])))';
export const RECENT_ERRORS = '{service_name=~".+"} |~ "(?i)(error|exception|fatal|panic)"';
