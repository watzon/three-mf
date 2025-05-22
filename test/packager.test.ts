import { describe, it, expect } from 'bun:test';
import { create3MFArchive } from '../src/packager';

describe('create3MFArchive', () => {
  it('should include default parts in the archive', async () => {
    const xmlObj = { model: { '@_unit': 'millimeter' } };
    const zip = create3MFArchive(xmlObj);
    const fileNames = Object.keys(zip.files);
    expect(fileNames).toContain('3D/3dmodel.model');
    expect(fileNames).toContain('_rels/.rels');
    expect(fileNames).toContain('[Content_Types].xml');

    const modelContent = await zip.file('3D/3dmodel.model')!.async('text');
    expect(modelContent.startsWith('<?xml version="1.0"')).toBe(true);
    expect(modelContent).toContain('<model');

    const relsContent = await zip.file('_rels/.rels')!.async('text');
    expect(relsContent).toContain('Target="3D/3dmodel.model"');
  });

  it('should respect a custom modelFilePath', async () => {
    const xmlObj = { model: { '@_unit': 'millimeter' } };
    const customPath = 'custom/path/my.model';
    const zip = create3MFArchive(xmlObj, customPath);
    const fileNames = Object.keys(zip.files);
    expect(fileNames).toContain(customPath);

    const relsContent = await zip.file('_rels/.rels')!.async('text');
    expect(relsContent).toContain(`Target="${customPath}"`);
  });
}); 