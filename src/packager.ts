import JSZip from 'jszip';
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

  // Add root relationships
  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="${modelFilePath}"/>
</Relationships>`;
  zip.folder('_rels')!.file('.rels', relsXml);

  // Add content types
  const typesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', typesXml);

  return zip;
} 