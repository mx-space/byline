export enum RedisKeys {
  ConfigCache = 'config_cache',
  ConfigVersion = 'config_version',
  TranslationEntryDict = 'translation_entry_dict',
  JWTStore = 'jwt_store',
  Socket = 'socket',

  WsBus = 'ws_bus',
  WsNode = 'ws_node',
  WsNodes = 'ws_nodes',
  WsConns = 'ws_conns',
  WsRoom = 'ws_room',
  WsRooms = 'ws_rooms',
}
export const API_CACHE_PREFIX = 'mx-api-cache:'
