export interface ContainerAuditFixture {
  fixtureId: string;
  manifestName: string;
  imageDigest: string;
  containerUser: string;
  privileged: boolean;
  pidMode: string;
  usernsMode: string;
  capAdd: string[];
  mounts: {
    source: string;
    destination: string;
    mode: string;
    cisSeverity: 'CRITICAL' | 'HIGH' | 'INFO';
  }[];
  cisFindings: string[];
  cisFindingsZh: string[];
}

export const CONTAINER_FIXTURES: Record<string, ContainerAuditFixture> = {
  'lantern-collector.json': {
    fixtureId: 'fix-container-lantern-collector-01',
    manifestName: 'lantern-collector.json',
    imageDigest: 'registry.vespera.internal/lantern/syncd@sha256:9904c11a8f22...',
    containerUser: '0:0 (root)',
    privileged: true,
    pidMode: 'host',
    usernsMode: 'host (no namespace remapping)',
    capAdd: ['CAP_SYS_ADMIN', 'CAP_NET_ADMIN', 'CAP_DAC_OVERRIDE'],
    mounts: [
      {
        source: '/var/run/docker.sock',
        destination: '/var/run/docker.sock',
        mode: 'rw',
        cisSeverity: 'CRITICAL',
      },
      {
        source: '/var/log/vespera_host_audit',
        destination: '/host_logs',
        mode: 'rw',
        cisSeverity: 'HIGH',
      },
    ],
    cisFindings: [
      'CIS-DOCKER-5.4 [CRITICAL]: Privileged=true grants full host kernel capabilities.',
      'CIS-DOCKER-5.31 [CRITICAL]: Host Docker socket (/var/run/docker.sock) is mounted read-write inside the container, allowing direct host root execution and log manipulation.',
      'CIS-DOCKER-5.15 [HIGH]: Host PID namespace shared (PidMode="host").',
    ],
    cisFindingsZh: [
      'CIS-DOCKER-5.4 [严重]: Privileged=true 赋予了容器完整的宿主机内核特权。',
      'CIS-DOCKER-5.31 [严重]: 将宿主机 /var/run/docker.sock 以读写模式挂载入容器，使容器进程可直接操控宿主机并改写底层审计日志。',
      'CIS-DOCKER-5.15 [高危]: 共享宿主机进程命名空间 (PidMode="host")。',
    ],
  },
};
