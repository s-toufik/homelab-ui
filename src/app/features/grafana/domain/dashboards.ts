import type { ChartUnit } from '@shared/ui/charts/chart-format';

export type PanelKind = 'gauge' | 'stat' | 'timeseries' | 'bars' | 'logs';
export type PanelWidth = 'quarter' | 'half' | 'full';

export interface PanelQuery {
  expr: string;
  legend?: string;
  source?: 'prometheus' | 'loki';
}

export interface Panel {
  title: string;
  kind: PanelKind;
  width: PanelWidth;
  unit?: ChartUnit;
  max?: number;
  queries: PanelQuery[];
}

export interface DashboardSection {
  title?: string;
  panels: Panel[];
}

export interface Dashboard {
  id: string;
  title: string;
  description: string;
  sections: DashboardSection[];
}

const NET_DEVICES = 'device!~"lo|veth.*|cni0|flannel.*|k3s0|tailscale.*"';
const ROOT_FS = 'mountpoint="/",fstype!~"tmpfs|overlay"';
const CORE_TEMP =
  'node_hwmon_temp_celsius * on(chip, sensor) group_left(label) node_hwmon_sensor_label';
const RATE = '$__rate_interval';

export const DASHBOARDS: readonly Dashboard[] = [
  {
    id: 'homelab-overview',
    title: 'Homelab overview',
    description: 'The server, its containers, Kafka and the logs.',
    sections: [
      {
        title: 'Host',
        panels: [
          {
            title: 'CPU usage',
            kind: 'gauge',
            width: 'quarter',
            unit: 'percent',
            max: 100,
            queries: [{ expr: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))' }],
          },
          {
            title: 'Memory usage',
            kind: 'gauge',
            width: 'quarter',
            unit: 'percent',
            max: 100,
            queries: [
              { expr: '100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)' },
            ],
          },
          {
            title: 'Root disk usage',
            kind: 'gauge',
            width: 'quarter',
            unit: 'percent',
            max: 100,
            queries: [
              {
                expr: `100 * (1 - node_filesystem_avail_bytes{${ROOT_FS}} / node_filesystem_size_bytes{${ROOT_FS}})`,
              },
            ],
          },
          {
            title: 'Scrape targets down',
            kind: 'stat',
            width: 'quarter',
            queries: [{ expr: 'count(up == 0) or vector(0)' }],
          },
          {
            title: 'CPU by mode',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: 'sum by (mode) (rate(node_cpu_seconds_total{mode!="idle"}[5m]))',
                legend: '{{mode}}',
              },
            ],
          },
          {
            title: 'Load average',
            kind: 'timeseries',
            width: 'half',
            queries: [
              { expr: 'node_load1', legend: '1m' },
              { expr: 'node_load5', legend: '5m' },
              { expr: 'node_load15', legend: '15m' },
            ],
          },
          {
            title: 'Network throughput',
            kind: 'timeseries',
            width: 'half',
            unit: 'bytesPerSecond',
            queries: [
              {
                expr: `sum(rate(node_network_receive_bytes_total{${NET_DEVICES}}[5m]))`,
                legend: 'received',
              },
              {
                expr: `sum(rate(node_network_transmit_bytes_total{${NET_DEVICES}}[5m]))`,
                legend: 'sent',
              },
            ],
          },
          {
            title: 'Disk IO',
            kind: 'timeseries',
            width: 'half',
            unit: 'bytesPerSecond',
            queries: [
              { expr: 'sum(rate(node_disk_read_bytes_total[5m]))', legend: 'read' },
              { expr: 'sum(rate(node_disk_written_bytes_total[5m]))', legend: 'written' },
            ],
          },
          {
            title: 'Disk space',
            kind: 'bars',
            width: 'half',
            unit: 'bytes',
            queries: [
              { expr: 'node_filesystem_size_bytes{mountpoint="/"}', legend: 'Capacity' },
              {
                expr: 'node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_avail_bytes{mountpoint="/"}',
                legend: 'Used',
              },
              { expr: 'node_filesystem_avail_bytes{mountpoint="/"}', legend: 'Free' },
            ],
          },
          {
            title: 'Days until the disk is full',
            kind: 'stat',
            width: 'half',
            queries: [
              {
                expr: '(node_filesystem_avail_bytes{mountpoint="/"} / -deriv(node_filesystem_avail_bytes{mountpoint="/"}[6h]) / 86400) > 0',
              },
            ],
          },
        ],
      },
      {
        title: 'Containers',
        panels: [
          {
            title: 'CPU by container (% of a core)',
            kind: 'timeseries',
            width: 'half',
            unit: 'percent',
            queries: [
              {
                expr: 'sum by (container) (100 * rate(container_cpu_usage_seconds_total{namespace="homelab", container!="", container!="POD"}[5m]))',
                legend: '{{container}}',
              },
            ],
          },
          {
            title: 'Memory by container',
            kind: 'timeseries',
            width: 'half',
            unit: 'bytes',
            queries: [
              {
                expr: 'sum by (container) (container_memory_working_set_bytes{namespace="homelab", container!="", container!="POD"})',
                legend: '{{container}}',
              },
            ],
          },
        ],
      },
      {
        title: 'Kafka',
        panels: [
          {
            title: 'Messages in / s by topic',
            kind: 'timeseries',
            width: 'half',
            unit: 'perSecond',
            queries: [
              {
                expr: 'sum by (topic) (rate(kafka_topic_partition_current_offset{topic!~"__.*"}[5m]))',
                legend: '{{topic}}',
              },
            ],
          },
          {
            title: 'Consumer group lag',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: 'sum by (consumergroup, topic) (kafka_consumergroup_lag)',
                legend: '{{consumergroup}} / {{topic}}',
              },
            ],
          },
        ],
      },
      {
        title: 'Logs',
        panels: [
          {
            title: 'Log volume by service',
            kind: 'timeseries',
            width: 'full',
            queries: [
              {
                expr: 'sum by (service_name) (count_over_time({service_name=~".+"} [1m]))',
                legend: '{{service_name}}',
                source: 'loki',
              },
            ],
          },
          {
            title: 'Error logs',
            kind: 'logs',
            width: 'full',
            queries: [
              { expr: '{service_name=~".+"} |~ "(?i)(error|exception|fatal)"', source: 'loki' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'llm',
    title: 'LLM (llama.cpp)',
    description: 'Generation speed, requests and the LLM container.',
    sections: [
      {
        panels: [
          {
            title: 'Server status',
            kind: 'stat',
            width: 'quarter',
            queries: [{ expr: 'up{job="llama-cpp"}', legend: '{{model}}' }],
          },
          {
            title: 'Generation speed (tokens/s, 5m)',
            kind: 'stat',
            width: 'quarter',
            queries: [
              {
                expr: 'sum by (model) (rate(llamacpp:tokens_predicted_total[5m])) / sum by (model) (rate(llamacpp:tokens_predicted_seconds_total[5m]))',
                legend: '{{model}}',
              },
            ],
          },
          {
            title: 'Requests in progress',
            kind: 'stat',
            width: 'quarter',
            queries: [
              { expr: 'sum by (model) (llamacpp:requests_processing)', legend: '{{model}}' },
            ],
          },
          {
            title: 'Requests waiting',
            kind: 'stat',
            width: 'quarter',
            queries: [{ expr: 'sum by (model) (llamacpp:requests_deferred)', legend: '{{model}}' }],
          },
          {
            title: 'Generation speed (tokens/s)',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: `sum by (model) (rate(llamacpp:tokens_predicted_total[${RATE}])) / sum by (model) (rate(llamacpp:tokens_predicted_seconds_total[${RATE}]))`,
                legend: '{{model}}',
              },
            ],
          },
          {
            title: 'Prompt processing speed (tokens/s)',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: `sum by (model) (rate(llamacpp:prompt_tokens_total[${RATE}])) / sum by (model) (rate(llamacpp:prompt_seconds_total[${RATE}]))`,
                legend: '{{model}}',
              },
            ],
          },
          {
            title: 'Tokens per minute',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: `sum by (model) (rate(llamacpp:tokens_predicted_total[${RATE}])) * 60`,
                legend: '{{model}} generated',
              },
              {
                expr: `sum by (model) (rate(llamacpp:prompt_tokens_total[${RATE}])) * 60`,
                legend: '{{model}} prompt',
              },
            ],
          },
          {
            title: 'Requests (in progress / waiting)',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: 'sum by (model) (llamacpp:requests_processing)',
                legend: '{{model}} processing',
              },
              { expr: 'sum by (model) (llamacpp:requests_deferred)', legend: '{{model}} waiting' },
            ],
          },
          {
            title: 'Container memory',
            kind: 'timeseries',
            width: 'half',
            unit: 'bytes',
            queries: [
              {
                expr: 'container_memory_working_set_bytes{namespace="homelab", container="llm"}',
                legend: 'used',
              },
              {
                expr: 'container_spec_memory_limit_bytes{namespace="homelab", container="llm"}',
                legend: 'limit',
              },
            ],
          },
          {
            title: 'Container CPU (cores)',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: `sum by (container) (rate(container_cpu_usage_seconds_total{namespace="homelab", container="llm"}[${RATE}]))`,
                legend: '{{container}}',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'server-health',
    title: 'Server health',
    description: 'Temperatures, CPU cores, throttling and the internet line.',
    sections: [
      {
        panels: [
          {
            title: 'CPU temperature',
            kind: 'gauge',
            width: 'quarter',
            unit: 'celsius',
            max: 100,
            queries: [{ expr: `max(${CORE_TEMP}{label=~"Package.*|Tctl|Tdie"})` }],
          },
          {
            title: 'Disk usage',
            kind: 'gauge',
            width: 'quarter',
            unit: 'percent',
            max: 100,
            queries: [
              {
                expr: '100 * (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})',
              },
            ],
          },
          {
            title: 'Core temperatures',
            kind: 'bars',
            width: 'half',
            unit: 'celsius',
            max: 100,
            queries: [{ expr: `${CORE_TEMP}{label=~"Core.*"}`, legend: '{{label}}' }],
          },
          {
            title: 'CPU usage per core',
            kind: 'bars',
            width: 'half',
            unit: 'percent',
            max: 100,
            queries: [
              {
                expr: '100 * (1 - avg by (cpu) (rate(node_cpu_seconds_total{mode="idle"}[5m])))',
                legend: 'core {{cpu}}',
              },
            ],
          },
          {
            title: 'CPU temperature',
            kind: 'timeseries',
            width: 'half',
            unit: 'celsius',
            queries: [{ expr: `max(${CORE_TEMP}{label=~"Package.*|Tctl|Tdie"})`, legend: 'CPU' }],
          },
          {
            title: 'CPU throttling',
            kind: 'timeseries',
            width: 'half',
            unit: 'perSecond',
            queries: [
              { expr: 'sum(rate(node_cpu_core_throttles_total[5m]))', legend: 'throttles' },
            ],
          },
          {
            title: 'Ping and jitter (relative to 3 h average)',
            kind: 'timeseries',
            width: 'half',
            queries: [
              {
                expr: 'last_over_time(internet_ping_ms[3h]) / avg_over_time(internet_ping_ms[3h])',
                legend: 'Ping',
              },
              {
                expr: 'last_over_time(internet_jitter_ms[3h]) / avg_over_time(internet_jitter_ms[3h])',
                legend: 'Jitter',
              },
            ],
          },
          {
            title: 'Download and upload (Mbit/s)',
            kind: 'timeseries',
            width: 'half',
            queries: [
              { expr: 'last_over_time(internet_download_mbps[3h])', legend: 'Download' },
              { expr: 'last_over_time(internet_upload_mbps[3h])', legend: 'Upload' },
            ],
          },
        ],
      },
    ],
  },
];

export function withRateInterval(expr: string, stepSec: number): string {
  return expr.replaceAll(RATE, `${Math.max(stepSec * 4, 60)}s`);
}
