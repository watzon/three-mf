// Serializer support for 3MF Production Extension
// TODO: Implement serialization of production extension attributes

import { PRODUCTION_EXTENSION_NAMESPACE, PRODUCTION_EXTENSION_PREFIX } from './constants';

/**
 * Adds production extension attributes to the XML object before building XML.
 * @param xmlObj The XML object representation (parsed JSON) for serialization
 */
export function serializeProductionExtensions(xmlObj: any): void {
  if (!xmlObj || !xmlObj.model) return;
  const model = xmlObj.model;

  // Declare the production namespace on the model element
  model[`@_xmlns:${PRODUCTION_EXTENSION_PREFIX}`] = PRODUCTION_EXTENSION_NAMESPACE;

  // Build-level UUID
  if (model.build && model.build.buildUUID) {
    model.build[`@_${PRODUCTION_EXTENSION_PREFIX}:UUID`] = model.build.buildUUID;
  }

  // Items within build
  if (model.build && model.build.item) {
    const items = Array.isArray(model.build.item) ? model.build.item : [model.build.item];
    for (const item of items) {
      if (item.path) {
        item['@_path'] = item.path;
      }
      if (item.itemUUID) {
        item[`@_${PRODUCTION_EXTENSION_PREFIX}:UUID`] = item.itemUUID;
      }
    }
  }

  // Objects and their components
  if (model.resources && model.resources.object) {
    const objects = Array.isArray(model.resources.object)
      ? model.resources.object
      : [model.resources.object];
    for (const object of objects) {
      if (object.resourceUUID) {
        object[`@_${PRODUCTION_EXTENSION_PREFIX}:UUID`] = object.resourceUUID;
      }
      if (object.components && object.components.component) {
        const comps = Array.isArray(object.components.component)
          ? object.components.component
          : [object.components.component];
        for (const comp of comps) {
          if (comp.path) {
            comp['@_path'] = comp.path;
          }
          if (comp.componentUUID) {
            comp[`@_${PRODUCTION_EXTENSION_PREFIX}:UUID`] = comp.componentUUID;
          }
        }
      }
    }
  }
}

/**
 * Generates OPC .rels entries for any referenced non-root model parts.
 * @param xmlObj The XML object representation (parsed JSON)
 * @returns Array of relationship entries to include in .rels file
 */
export function generatePartRels(xmlObj: any): Array<{ Id: string; Type: string; Target: string }> {
  const rels: Array<{ Id: string; Type: string; Target: string }> = [];
  if (!xmlObj?.model) return rels;
  const model = xmlObj.model;
  let counter = 1;
  const REL_TYPE = 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel';

  // Include build item references
  if (model.build && model.build.item) {
    const items = Array.isArray(model.build.item) ? model.build.item : [model.build.item];
    for (const item of items) {
      if (item.path) {
        rels.push({ Id: `rel${counter}`, Type: REL_TYPE, Target: item.path });
        counter++;
      }
    }
  }

  // Include resource object references
  if (model.resources && model.resources.object) {
    const objects = Array.isArray(model.resources.object)
      ? model.resources.object
      : [model.resources.object];
    for (const object of objects) {
      if (object.path) {
        rels.push({ Id: `rel${counter}`, Type: REL_TYPE, Target: object.path });
        counter++;
      }
      // Include component references
      if (object.components && object.components.component) {
        const comps = Array.isArray(object.components.component)
          ? object.components.component
          : [object.components.component];
        for (const comp of comps) {
          if (comp.path) {
            rels.push({ Id: `rel${counter}`, Type: REL_TYPE, Target: comp.path });
            counter++;
          }
        }
      }
    }
  }
  return rels;
} 