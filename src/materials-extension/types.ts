// Types for 3MF Materials and Properties Extension (version 1.2.1)

export type ResourceID = number;
export type ResourceIndex = number;
export type ResourceIndices = ResourceIndex[];
export type ResourceIDs = ResourceID[];
export type BlendMethod = 'mix' | 'multiply';

export type TileStyle = 'clamp' | 'wrap' | 'mirror' | 'none';
export type Filter = 'auto' | 'linear' | 'nearest';
export type ColorValue = string; // e.g. '#RRGGBB' or '#RRGGBBAA'
export type UriReference = string; // e.g. '/path/to/texture.png'

export interface Texture2D {
  id: ResourceID;
  path: UriReference;
  contentType: 'image/jpeg' | 'image/png';
  tileStyleU?: TileStyle;
  tileStyleV?: TileStyle;
  filter?: Filter;
  [key: string]: any;
}

export interface Tex2Coord {
  u: number;
  v: number;
  [key: string]: any;
}

export interface Texture2DGroup {
  id: ResourceID;
  texId: ResourceID;
  displayPropertiesId?: ResourceID;
  tex2Coords: Tex2Coord[];
  [key: string]: any;
}

export interface Color {
  color: ColorValue;
  [key: string]: any;
}

export interface ColorGroup {
  id: ResourceID;
  displayPropertiesId?: ResourceID;
  colors: Color[];
  [key: string]: any;
}

export interface Composite {
  values: number[];
  [key: string]: any;
}

export interface CompositeMaterials {
  id: ResourceID;
  matId: ResourceID;
  matIndices: ResourceIndex[];
  displayPropertiesId?: ResourceID;
  composites: Composite[];
  [key: string]: any;
}

export interface Multi {
  pIndices: ResourceIndex[];
  [key: string]: any;
}

export interface MultiProperties {
  id: ResourceID;
  pids: ResourceID[];
  blendMethods?: BlendMethod[];
  multis: Multi[];
  [key: string]: any;
}

export interface PBSpecular {
  name: string;
  specularColor?: ColorValue;
  glossiness?: number;
  [key: string]: any;
}

export interface PBSpecularDisplayProperties {
  id: ResourceID;
  specular: PBSpecular[];
  [key: string]: any;
}

export interface PBMetallic {
  name: string;
  metallicness?: number;
  roughness?: number;
  [key: string]: any;
}

export interface PBMetallicDisplayProperties {
  id: ResourceID;
  metallic: PBMetallic[];
  [key: string]: any;
}

export interface PBSpecularTextureDisplayProperties {
  id: ResourceID;
  name: string;
  specularTextureId: ResourceID;
  glossinessTextureId: ResourceID;
  diffuseFactor?: ColorValue;
  specularFactor?: ColorValue;
  glossinessFactor?: number;
  [key: string]: any;
}

export interface PBMetallicTextureDisplayProperties {
  id: ResourceID;
  name: string;
  metallicTextureId: ResourceID;
  roughnessTextureId: ResourceID;
  metallicFactor?: number;
  roughnessFactor?: number;
  [key: string]: any;
}

export interface Translucent {
  name: string;
  attenuation: number[];
  refractiveIndex?: number[];
  roughness?: number;
  [key: string]: any;
}

export interface TranslucentDisplayProperties {
  id: ResourceID;
  translucent: Translucent[];
  [key: string]: any;
}

export interface MaterialsExtensionResources {
  textures: Map<ResourceID, Texture2D>;
  texture2DGroups: Map<ResourceID, Texture2DGroup>;
  colorGroups: Map<ResourceID, ColorGroup>;
  compositeMaterials: Map<ResourceID, CompositeMaterials>;
  multiProperties: Map<ResourceID, MultiProperties>;
  displayProperties: Map<
    ResourceID,
    PBSpecularDisplayProperties |
    PBMetallicDisplayProperties |
    PBSpecularTextureDisplayProperties |
    PBMetallicTextureDisplayProperties |
    TranslucentDisplayProperties
  >;
} 