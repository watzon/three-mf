import JSZip from 'jszip';
import { readFileSync } from 'fs';
import { XMLBuilder } from 'fast-xml-parser';
import type { ThreeMFXml } from './builder';

/**
 * Creates a JSZip instance representing a .3mf archive containing the given XML object.
 * @param xmlObj Parsed XML object ready for serialization
 * @param modelFilePath Path inside the archive where the main model XML will be stored (default '3D/3dmodel.model').
 */
export function create3MFArchive(xmlObj: ThreeMFXml, modelFilePath: string = '3D/3dmodel.model'): JSZip {
  // Build model XML string
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(xmlObj);

  const zip = new JSZip();
  // Add model part
  zip.file(modelFilePath, xmlContent);

  // Handle extension resources (e.g., textures)
  const resources: any = (xmlObj as any).model.resources;
  const extRels: string[] = [];
  let relId = 2;
  if (resources && (resources as any).texture2d) {
    const textures = Array.isArray((resources as any).texture2d)
      ? (resources as any).texture2d
      : [(resources as any).texture2d];
    for (const tex of textures) {
      const p = tex['@_path'];
      const zipPath = p.replace(/^\//, '');
      const data = readFileSync(p);
      zip.file(zipPath, data);
      extRels.push(
        '  <Relationship Id="rId' +
          relId +
          '" Type="http://schemas.microsoft.com/3dmanufacturing/material/2015/02/texture2d" Target="' +
          zipPath +
          '"/>'
      );
      relId++;
    }
  }

  // Build root relationships including extension parts
  const relationships = [
    '<Relationship Id="rId1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="' +
      modelFilePath +
      '"/>',
    ...extRels
  ];
  const relsXmlNew =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
    relationships.join('\n') +
    '\n</Relationships>';
  zip.folder('_rels')!.file('.rels', relsXmlNew);

  // Build content types including extension file types
  const defaultTypes = [
    { extension: 'rels', contentType: 'application/vnd.openxmlformats-package.relationships+xml' },
    { extension: 'model', contentType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' }
  ];
  const extTypesMap = new Map<string, string>();
  if (resources && (resources as any).texture2d) {
    const textures = Array.isArray((resources as any).texture2d)
      ? (resources as any).texture2d
      : [(resources as any).texture2d];
    for (const tex of textures) {
      const p = tex['@_path'];
      const ext = p.split('.').pop()!;
      extTypesMap.set(ext, tex['@_contenttype']);
    }
  }
  let typesXmlNew =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
  for (const t of defaultTypes) {
    typesXmlNew +=
      '  <Default Extension="' + t.extension + '" ContentType="' + t.contentType + '"/>\n';
  }
  for (const [ext, ct] of extTypesMap) {
    typesXmlNew += '  <Default Extension="' + ext + '" ContentType="' + ct + '"/>\n';
  }
  typesXmlNew += '</Types>';
  zip.file('[Content_Types].xml', typesXmlNew);

  return zip;
} 