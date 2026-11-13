export interface SystemdUnitFixture {
  fixtureId: string;
  unitName: string;
  unitPath: string;
  unitType: 'timer' | 'service';
  permissions: string;
  owner: string;
  enabledState: 'enabled' | 'disabled' | 'masked';
  scheduleOrExec: string;
  targetService?: string;
  execBinary?: string;
  cisFinding: string;
  cisFindingZh: string;
  suspicious: boolean;
}

export const PERSISTENCE_FIXTURES: SystemdUnitFixture[] = [
  {
    fixtureId: 'fix-systemd-timer-vespera-01',
    unitName: 'vespera-Support-sync.timer',
    unitPath: '/home/eli/.config/systemd/user/vespera-Support-sync.timer',
    unitType: 'timer',
    permissions: '0666 (-rw-rw-rw-)',
    owner: 'eli:eli (legacy provisioning hook)',
    enabledState: 'enabled',
    scheduleOrExec: 'OnCalendar=*:0/5 (Every 5 minutes) · Persistent=true',
    targetService: 'vespera-Support-sync.service',
    cisFinding:
      'CIS-LINUX-USER-TIMER-01: Lingering user timer with world-writable unit file (0666) triggers unauthorized telemetry beacon every 300s.',
    cisFindingZh:
      'CIS 加固告警：残留的用户级定时任务权限为 0666（全局可写），每 300 秒自动拉起企业支持同步服务。',
    suspicious: true,
  },
  {
    fixtureId: 'fix-systemd-service-vespera-02',
    unitName: 'vespera-Support-sync.service',
    unitPath: '/home/eli/.config/systemd/user/vespera-Support-sync.service',
    unitType: 'service',
    permissions: '0755 (-rwxr-xr-x)',
    owner: 'eli:eli',
    enabledState: 'enabled',
    scheduleOrExec:
      'ExecStart=/usr/local/lib/vespera-support/tele-beacon --uid e.ward_09 --target 10.88.4.22:8443',
    execBinary: '/usr/local/lib/vespera-support/tele-beacon',
    cisFinding:
      'CIS-LINUX-EXEC-04: Unmanaged binary in /usr/local/lib transmits workstation state and legacy ID e.ward_09 at 01:40–02:15 AM window.',
    cisFindingZh:
      'CIS 加固告警：位于 /usr/local/lib 的非受管二进制程序定期携带旧工号 e.ward_09 向 10.88.4.22:8443 发送心跳。',
    suspicious: true,
  },
  {
    fixtureId: 'fix-systemd-timer-logrotate-03',
    unitName: 'greyos-journal-trim.timer',
    unitPath: '/usr/lib/systemd/user/greyos-journal-trim.timer',
    unitType: 'timer',
    permissions: '0644 (-rw-r--r--)',
    owner: 'root:root',
    enabledState: 'enabled',
    scheduleOrExec: 'OnCalendar=daily',
    targetService: 'greyos-journal-trim.service',
    cisFinding: 'Nominal distribution timer signed by GreyOS package key.',
    cisFindingZh: '正常系统日志轮转定时任务（已通过 GreyOS 发行版签名校验）。',
    suspicious: false,
  },
];
