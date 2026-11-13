export interface DocumentMetadataFixture {
  fixtureId: string;
  fileName: string;
  filePath: string;
  sha256Original: string;
  sha256Sanitized: string;
  sanitizedCopyPath: string;
  embeddedFields: {
    key: string;
    originalValue: string;
    sanitizedValue: string;
    isIdentityLeak: boolean;
  }[];
}

export const METADATA_FIXTURES: Record<string, DocumentMetadataFixture> = {
  'incident_0427_brief.pdf': {
    fixtureId: 'fix-meta-pdf-0427',
    fileName: 'incident_0427_brief.pdf',
    filePath: '/home/eli/Documents/incident_0427_brief.pdf',
    sha256Original: '4b92e81a0c7f3312d84e9012f66c1a239804ab12ef9011c4',
    sha256Sanitized: 'e90184c7721b6032a11f4098cc712300aa894120de441209',
    sanitizedCopyPath: '/home/eli/Documents/incident_0427_brief.clean.pdf',
    embeddedFields: [
      {
        key: 'XMP:Author',
        originalValue: 'e.ward_09',
        sanitizedValue: '[REDACTED_ANONYMOUS]',
        isIdentityLeak: true,
      },
      {
        key: 'PDF:ProducerHost',
        originalValue: 'apt4b-workstation',
        sanitizedValue: 'greyos-clean-export',
        isIdentityLeak: true,
      },
      {
        key: 'EXIF:Software',
        originalValue: 'GreyOS-LibreWriter-6.4 (UID=1000/eli)',
        sanitizedValue: 'PDF/A-1b Standard',
        isIdentityLeak: true,
      },
      {
        key: 'XMP:CreateDate',
        originalValue: '2028-04-27T02:16:04-04:00',
        sanitizedValue: '1970-01-01T00:00:00Z',
        isIdentityLeak: false,
      },
    ],
  },
};
