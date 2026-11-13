export interface EbpfTraceEventFixture {
  timestamp: string;
  pid: number;
  comm: string;
  syscall: string;
  argsSummary: string;
  returnCode: string;
  significance: string;
  significanceZh: string;
}

export interface EbpfTraceFixture {
  fixtureId: string;
  traceName: string;
  events: EbpfTraceEventFixture[];
}

export const EBPF_FIXTURES: Record<string, EbpfTraceFixture> = {
  'lantern-syncd.trace': {
    fixtureId: 'fix-ebpf-trace-lantern-0427',
    traceName: 'lantern-syncd.trace',
    events: [
      {
        timestamp: '01:54:12.104',
        pid: 4418,
        comm: 'lantern-syncd',
        syscall: 'openat',
        argsSummary: 'dfd=AT_FDCWD, filename="/host_logs/civic_tenant_ledger.db", flags=O_RDONLY',
        returnCode: 'fd=7',
        significance: 'Container process reads municipal tenant database via host mount.',
        significanceZh: '容器进程通过挂载目录读取市政租户数据库。',
      },
      {
        timestamp: '01:54:12.489',
        pid: 4418,
        comm: 'lantern-syncd',
        syscall: 'uprobe:calc_citizen_threat_score',
        argsSummary: 'tenant_batch=1240, threshold=0.75, output="/tmp/lantern_blacklist_0427.batch"',
        returnCode: 'flagged=89',
        significance: 'Executes calc_citizen_threat_score on 1,240 Greyhaven residents, flagging 89 tenants.',
        significanceZh: '对 1,240 名灰港市民运行 calc_citizen_threat_score 风险评分函数，将 89 名租户列入清退名单。',
      },
      {
        timestamp: '01:55:48.902',
        pid: 4418,
        comm: 'lantern-syncd',
        syscall: 'connect',
        argsSummary: 'fd=9, addr=/var/run/docker.sock -> POST /v1.43/containers/create (host log purge helper)',
        returnCode: '0 (OK)',
        significance: 'Uses mounted /var/run/docker.sock to spawn a privileged host task right before log purge #9904.',
        significanceZh: '在 #9904 日志清洗指令执行前一秒，通过挂载的 /var/run/docker.sock 调用宿主机接口。',
      },
    ],
  },
};
