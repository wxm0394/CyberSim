export interface SyntheticElfFixture {
  fixtureId: string;
  binaryName: string;
  binaryPath: string;
  elfMagicAndClass: string;
  architecture: string;
  buildIdSha1: string;
  stripped: boolean;
  importedSymbols: string[];
  extractedStrings: string[];
  criticalFunctions: {
    name: string;
    offset: string;
    decompiledSummary: string;
    decompiledSummaryZh: string;
  }[];
}

export const BINARY_FIXTURES: Record<string, SyntheticElfFixture> = {
  'lantern-syncd': {
    fixtureId: 'fix-elf-lantern-syncd-01',
    binaryName: 'lantern-syncd',
    binaryPath: '/home/eli/Downloads/incident_0427/lantern-syncd',
    elfMagicAndClass: '7f 45 4c 46 02 01 01 00 (ELF 64-bit LSB pie executable)',
    architecture: 'x86-64 (AMD64) · System V ABI',
    buildIdSha1: 'b841e09c7721a4409f112c388041de9904ab1120',
    stripped: false,
    importedSymbols: [
      'sqlite3_exec@LIBSQLITE3',
      'SSL_CTX_new@OPENSSL_3.0.0',
      'pthread_mutex_lock@GLIBC_2.34',
      'calc_citizen_threat_score (LOCAL_SYM)',
      'dispatch_eviction_recommendation (LOCAL_SYM)',
    ],
    extractedStrings: [
      'PROJECT_LANTERN_CORE_SCORING_ENGINE_V2.4',
      'SELECT tenant_id, sublet_anomaly, union_contact_weight, transit_late_night FROM civic_ledger;',
      'score = (sublet_flag * 0.42) + (dissident_graph_degree * 0.38) + (curfew_mobility * 0.20)',
      '/var/run/docker.sock',
      'https://10.88.14.9:8443/api/v2/enclave/batch-blacklist',
    ],
    criticalFunctions: [
      {
        name: 'calc_citizen_threat_score',
        offset: '0x00402190',
        decompiledSummary:
          'Computes a weighted civic risk index (0.00–1.00) combining unlicensed sublet telemetry (0.42), encrypted journalist/union contact graph proximity (0.38), and late-night transit camera sightings (0.20). Scores >= 0.75 trigger automated lease termination notices.',
        decompiledSummaryZh:
          '计算市民综合风险指数（0.00–1.00）：将未登记合租特征（权重 0.42）、记者/工会通信图谱关联度（权重 0.38）与深夜街区监控出现频次（权重 0.20）加权求和。当得分 >= 0.75 时自动生成租约清退与信用降级指令。',
      },
    ],
  },
};
