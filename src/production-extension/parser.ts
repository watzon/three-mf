// Parser support for 3MF Production Extension
// TODO: Implement parsing of production extension attributes

import { PRODUCTION_EXTENSION_NAMESPACE, PRODUCTION_EXTENSION_PREFIX } from './constants';

/**
 * Parses production extension attributes from the parsed XML object.
 * @param xmlObj The parsed XML object from fast-xml-parser
 */
export function parseProductionExtensions(xmlObj: any): void {
  if (!xmlObj || !xmlObj.model) return;
  const model = xmlObj.model;
  // Check if production extension namespace is declared
  const nsKey = `@_xmlns:${PRODUCTION_EXTENSION_PREFIX}`;
  if (model[nsKey] !== PRODUCTION_EXTENSION_NAMESPACE) return;

  // Parse build-level UUID
  if (model.build && model.build[`@_${PRODUCTION_EXTENSION_PREFIX}:UUID`]) {
    model.build.buildUUID = model.build[`@_${PRODUCTION_EXTENSION_PREFIX}:UUID`];
  }

  // Parse items within build
  if (model.build && model.build.item) {
    const items = Array.isArray(model.build.item) ? model.build.item : [model.build.item];
    for (const item of items) {
      // Extract path attribute
      if (item['@_path']) {
        item.path = item['@_path'];
      }
      // Extract item UUID
      const uuidKey = `@_${PRODUCTION_EXTENSION_PREFIX}:UUID`;
      if (item[uuidKey]) {
        item.itemUUID = item[uuidKey];
      }
    }
  }

  // Parse objects within resources
  if (model.resources && model.resources.object) {
    const objects = Array.isArray(model.resources.object)
      ? model.resources.object
      : [model.resources.object];
    for (const object of objects) {
      // Extract object UUID
      const uuidKey = `@_${PRODUCTION_EXTENSION_PREFIX}:UUID`;
      if (object[uuidKey]) {
        object.resourceUUID = object[uuidKey];
      }
      // Parse components within object
      if (object.components && object.components.component) {
        const comps = Array.isArray(object.components.component)
          ? object.components.component
          : [object.components.component];
        for (const comp of comps) {
          // Extract path attribute
          if (comp['@_path']) {
            comp.path = comp['@_path'];
          }
          // Extract component UUID
          const compUuidKey = `@_${PRODUCTION_EXTENSION_PREFIX}:UUID`;
          if (comp[compUuidKey]) {
            comp.componentUUID = comp[compUuidKey];
          }
        }
      }
    }
  }
} 