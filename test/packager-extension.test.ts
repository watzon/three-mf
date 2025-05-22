import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { create3MFArchive } from '../src/packager';

describe('create3MFArchive with extension resources', () => {
  const texturePath = 'test/fixtures/texture1.png';

  beforeAll(() => {
    mkdirSync('test/fixtures', { recursive: true });
    writeFileSync(texturePath, 'dummydata');
  });

  afterAll(() => {
    rmSync(texturePath, { force: true });
  });

  it('should include texture binary file and relationships', async () => {
    const xmlObj: any = {
      model: {
        '@_unit': 'millimeter',
        '@_xmlns': 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel',
        '@_xmlns:m': 'http://schemas.microsoft.com/3dmanufacturing/material/2015/02',
        resources: {
          texture2d: {
            '@_id': '1',
            '@_path': texturePath,
            '@_contenttype': 'image/png'
          }
        }
      }
    };
    const zip = create3MFArchive(xmlObj);
    const fileNames = Object.keys(zip.files);
    expect(fileNames).toContain(texturePath);
    const data = await zip.file(texturePath)!.async('text');
    expect(data).toBe('dummydata');

    const relsContent = await zip.file('_rels/.rels')!.async('text');
    expect(relsContent).toContain(`Target="${texturePath}"`);

    const typesContent = await zip.file('[Content_Types].xml')!.async('text');
    expect(typesContent).toContain('Extension="png" ContentType="image/png"');
  });
}); 