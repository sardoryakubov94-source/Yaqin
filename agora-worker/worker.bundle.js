import __c from "node:crypto";import __z from "node:zlib";const require=(m)=>m.replace("node:","")==="crypto"?__c:m.replace("node:","")==="zlib"?__z:(()=>{throw new Error("module "+m)})();
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/crypt/crypt.js
var require_crypt = __commonJS({
  "node_modules/crypt/crypt.js"(exports, module) {
    (function() {
      var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", crypt = {
        // Bit-wise rotation left
        rotl: function(n, b) {
          return n << b | n >>> 32 - b;
        },
        // Bit-wise rotation right
        rotr: function(n, b) {
          return n << 32 - b | n >>> b;
        },
        // Swap big-endian to little-endian and vice versa
        endian: function(n) {
          if (n.constructor == Number) {
            return crypt.rotl(n, 8) & 16711935 | crypt.rotl(n, 24) & 4278255360;
          }
          for (var i = 0; i < n.length; i++)
            n[i] = crypt.endian(n[i]);
          return n;
        },
        // Generate an array of any length of random bytes
        randomBytes: function(n) {
          for (var bytes = []; n > 0; n--)
            bytes.push(Math.floor(Math.random() * 256));
          return bytes;
        },
        // Convert a byte array to big-endian 32-bit words
        bytesToWords: function(bytes) {
          for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
            words[b >>> 5] |= bytes[i] << 24 - b % 32;
          return words;
        },
        // Convert big-endian 32-bit words to a byte array
        wordsToBytes: function(words) {
          for (var bytes = [], b = 0; b < words.length * 32; b += 8)
            bytes.push(words[b >>> 5] >>> 24 - b % 32 & 255);
          return bytes;
        },
        // Convert a byte array to a hex string
        bytesToHex: function(bytes) {
          for (var hex = [], i = 0; i < bytes.length; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 15).toString(16));
          }
          return hex.join("");
        },
        // Convert a hex string to a byte array
        hexToBytes: function(hex) {
          for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
          return bytes;
        },
        // Convert a byte array to a base-64 string
        bytesToBase64: function(bytes) {
          for (var base64 = [], i = 0; i < bytes.length; i += 3) {
            var triplet = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
            for (var j = 0; j < 4; j++)
              if (i * 8 + j * 6 <= bytes.length * 8)
                base64.push(base64map.charAt(triplet >>> 6 * (3 - j) & 63));
              else
                base64.push("=");
          }
          return base64.join("");
        },
        // Convert a base-64 string to a byte array
        base64ToBytes: function(base64) {
          base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");
          for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
            if (imod4 == 0) continue;
            bytes.push((base64map.indexOf(base64.charAt(i - 1)) & Math.pow(2, -2 * imod4 + 8) - 1) << imod4 * 2 | base64map.indexOf(base64.charAt(i)) >>> 6 - imod4 * 2);
          }
          return bytes;
        }
      };
      module.exports = crypt;
    })();
  }
});

// node_modules/charenc/charenc.js
var require_charenc = __commonJS({
  "node_modules/charenc/charenc.js"(exports, module) {
    var charenc = {
      // UTF-8 encoding
      utf8: {
        // Convert a string to a byte array
        stringToBytes: function(str) {
          return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
        },
        // Convert a byte array to a string
        bytesToString: function(bytes) {
          return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
        }
      },
      // Binary encoding
      bin: {
        // Convert a string to a byte array
        stringToBytes: function(str) {
          for (var bytes = [], i = 0; i < str.length; i++)
            bytes.push(str.charCodeAt(i) & 255);
          return bytes;
        },
        // Convert a byte array to a string
        bytesToString: function(bytes) {
          for (var str = [], i = 0; i < bytes.length; i++)
            str.push(String.fromCharCode(bytes[i]));
          return str.join("");
        }
      }
    };
    module.exports = charenc;
  }
});

// node_modules/is-buffer/index.js
var require_is_buffer = __commonJS({
  "node_modules/is-buffer/index.js"(exports, module) {
    module.exports = function(obj) {
      return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
    };
    function isBuffer(obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    function isSlowBuffer(obj) {
      return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isBuffer(obj.slice(0, 0));
    }
  }
});

// node_modules/md5/md5.js
var require_md5 = __commonJS({
  "node_modules/md5/md5.js"(exports, module) {
    (function() {
      var crypt = require_crypt(), utf8 = require_charenc().utf8, isBuffer = require_is_buffer(), bin = require_charenc().bin, md5 = function(message, options) {
        if (message.constructor == String)
          if (options && options.encoding === "binary")
            message = bin.stringToBytes(message);
          else
            message = utf8.stringToBytes(message);
        else if (isBuffer(message))
          message = Array.prototype.slice.call(message, 0);
        else if (!Array.isArray(message) && message.constructor !== Uint8Array)
          message = message.toString();
        var m = crypt.bytesToWords(message), l = message.length * 8, a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (var i = 0; i < m.length; i++) {
          m[i] = (m[i] << 8 | m[i] >>> 24) & 16711935 | (m[i] << 24 | m[i] >>> 8) & 4278255360;
        }
        m[l >>> 5] |= 128 << l % 32;
        m[(l + 64 >>> 9 << 4) + 14] = l;
        var FF = md5._ff, GG = md5._gg, HH = md5._hh, II = md5._ii;
        for (var i = 0; i < m.length; i += 16) {
          var aa = a, bb = b, cc = c, dd = d;
          a = FF(a, b, c, d, m[i + 0], 7, -680876936);
          d = FF(d, a, b, c, m[i + 1], 12, -389564586);
          c = FF(c, d, a, b, m[i + 2], 17, 606105819);
          b = FF(b, c, d, a, m[i + 3], 22, -1044525330);
          a = FF(a, b, c, d, m[i + 4], 7, -176418897);
          d = FF(d, a, b, c, m[i + 5], 12, 1200080426);
          c = FF(c, d, a, b, m[i + 6], 17, -1473231341);
          b = FF(b, c, d, a, m[i + 7], 22, -45705983);
          a = FF(a, b, c, d, m[i + 8], 7, 1770035416);
          d = FF(d, a, b, c, m[i + 9], 12, -1958414417);
          c = FF(c, d, a, b, m[i + 10], 17, -42063);
          b = FF(b, c, d, a, m[i + 11], 22, -1990404162);
          a = FF(a, b, c, d, m[i + 12], 7, 1804603682);
          d = FF(d, a, b, c, m[i + 13], 12, -40341101);
          c = FF(c, d, a, b, m[i + 14], 17, -1502002290);
          b = FF(b, c, d, a, m[i + 15], 22, 1236535329);
          a = GG(a, b, c, d, m[i + 1], 5, -165796510);
          d = GG(d, a, b, c, m[i + 6], 9, -1069501632);
          c = GG(c, d, a, b, m[i + 11], 14, 643717713);
          b = GG(b, c, d, a, m[i + 0], 20, -373897302);
          a = GG(a, b, c, d, m[i + 5], 5, -701558691);
          d = GG(d, a, b, c, m[i + 10], 9, 38016083);
          c = GG(c, d, a, b, m[i + 15], 14, -660478335);
          b = GG(b, c, d, a, m[i + 4], 20, -405537848);
          a = GG(a, b, c, d, m[i + 9], 5, 568446438);
          d = GG(d, a, b, c, m[i + 14], 9, -1019803690);
          c = GG(c, d, a, b, m[i + 3], 14, -187363961);
          b = GG(b, c, d, a, m[i + 8], 20, 1163531501);
          a = GG(a, b, c, d, m[i + 13], 5, -1444681467);
          d = GG(d, a, b, c, m[i + 2], 9, -51403784);
          c = GG(c, d, a, b, m[i + 7], 14, 1735328473);
          b = GG(b, c, d, a, m[i + 12], 20, -1926607734);
          a = HH(a, b, c, d, m[i + 5], 4, -378558);
          d = HH(d, a, b, c, m[i + 8], 11, -2022574463);
          c = HH(c, d, a, b, m[i + 11], 16, 1839030562);
          b = HH(b, c, d, a, m[i + 14], 23, -35309556);
          a = HH(a, b, c, d, m[i + 1], 4, -1530992060);
          d = HH(d, a, b, c, m[i + 4], 11, 1272893353);
          c = HH(c, d, a, b, m[i + 7], 16, -155497632);
          b = HH(b, c, d, a, m[i + 10], 23, -1094730640);
          a = HH(a, b, c, d, m[i + 13], 4, 681279174);
          d = HH(d, a, b, c, m[i + 0], 11, -358537222);
          c = HH(c, d, a, b, m[i + 3], 16, -722521979);
          b = HH(b, c, d, a, m[i + 6], 23, 76029189);
          a = HH(a, b, c, d, m[i + 9], 4, -640364487);
          d = HH(d, a, b, c, m[i + 12], 11, -421815835);
          c = HH(c, d, a, b, m[i + 15], 16, 530742520);
          b = HH(b, c, d, a, m[i + 2], 23, -995338651);
          a = II(a, b, c, d, m[i + 0], 6, -198630844);
          d = II(d, a, b, c, m[i + 7], 10, 1126891415);
          c = II(c, d, a, b, m[i + 14], 15, -1416354905);
          b = II(b, c, d, a, m[i + 5], 21, -57434055);
          a = II(a, b, c, d, m[i + 12], 6, 1700485571);
          d = II(d, a, b, c, m[i + 3], 10, -1894986606);
          c = II(c, d, a, b, m[i + 10], 15, -1051523);
          b = II(b, c, d, a, m[i + 1], 21, -2054922799);
          a = II(a, b, c, d, m[i + 8], 6, 1873313359);
          d = II(d, a, b, c, m[i + 15], 10, -30611744);
          c = II(c, d, a, b, m[i + 6], 15, -1560198380);
          b = II(b, c, d, a, m[i + 13], 21, 1309151649);
          a = II(a, b, c, d, m[i + 4], 6, -145523070);
          d = II(d, a, b, c, m[i + 11], 10, -1120210379);
          c = II(c, d, a, b, m[i + 2], 15, 718787259);
          b = II(b, c, d, a, m[i + 9], 21, -343485551);
          a = a + aa >>> 0;
          b = b + bb >>> 0;
          c = c + cc >>> 0;
          d = d + dd >>> 0;
        }
        return crypt.endian([a, b, c, d]);
      };
      md5._ff = function(a, b, c, d, x, s, t) {
        var n = a + (b & c | ~b & d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._gg = function(a, b, c, d, x, s, t) {
        var n = a + (b & d | c & ~d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._hh = function(a, b, c, d, x, s, t) {
        var n = a + (b ^ c ^ d) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._ii = function(a, b, c, d, x, s, t) {
        var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
        return (n << s | n >>> 32 - s) + b;
      };
      md5._blocksize = 16;
      md5._digestsize = 16;
      module.exports = function(message, options) {
        if (message === void 0 || message === null)
          throw new Error("Illegal argument " + message);
        var digestbytes = crypt.wordsToBytes(md5(message, options));
        return options && options.asBytes ? digestbytes : options && options.asString ? bin.bytesToString(digestbytes) : crypt.bytesToHex(digestbytes);
      };
    })();
  }
});

// node_modules/agora-token/src/AccessToken2.js
var require_AccessToken2 = __commonJS({
  "node_modules/agora-token/src/AccessToken2.js"(exports, module) {
    var crypto = __require("node:crypto");
    var zlib = __require("node:zlib");
    var VERSION_LENGTH = 3;
    var getVersion = () => {
      return "007";
    };
    var isUuid = (value) => {
      return value !== null && typeof value !== "undefined" && /^[0-9a-fA-F]{32}$/.test(value.toString());
    };
    var Service = class {
      // Creates a service with the specified numeric type.
      constructor(service_type) {
        this.__type = service_type;
        this.__privileges = {};
      }
      // Serializes the numeric service type.
      __pack_type() {
        let buf = new ByteBuf();
        buf.putUint16(this.__type);
        return buf.pack();
      }
      // Serializes the service privilege map.
      __pack_privileges() {
        let buf = new ByteBuf();
        buf.putTreeMapUInt32(this.__privileges);
        return buf.pack();
      }
      // Returns the numeric service type.
      service_type() {
        return this.__type;
      }
      // Adds or updates a service privilege expiration timestamp.
      add_privilege(privilege, expire) {
        this.__privileges[privilege] = expire;
      }
      // Serializes the service type and privileges.
      pack() {
        return Buffer.concat([this.__pack_type(), this.__pack_privileges()]);
      }
      // Deserializes service privileges after the type has been consumed.
      unpack(buffer) {
        let bufReader = new ReadByteBuf(buffer);
        this.__privileges = bufReader.getTreeMapUInt32();
        return bufReader;
      }
    };
    var kRtcServiceType = 1;
    var ServiceRtc = class extends Service {
      // Creates an RTC service for a channel and user ID.
      constructor(channel_name, uid) {
        super(kRtcServiceType);
        this.__channel_name = channel_name;
        this.__uid = uid === 0 ? "" : `${uid}`;
      }
      // Serializes the RTC service payload.
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__channel_name).putString(this.__uid);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      // Deserializes the RTC service payload.
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__channel_name = bufReader.getString();
        this.__uid = bufReader.getString();
        return bufReader;
      }
    };
    ServiceRtc.kPrivilegeJoinChannel = 1;
    ServiceRtc.kPrivilegePublishAudioStream = 2;
    ServiceRtc.kPrivilegePublishVideoStream = 3;
    ServiceRtc.kPrivilegePublishDataStream = 4;
    var kRtmServiceType = 2;
    var ServiceRtm = class extends Service {
      // Creates an RTM service for a user ID.
      constructor(user_id) {
        super(kRtmServiceType);
        this.__user_id = user_id || "";
      }
      // Serializes the RTM service payload.
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      // Deserializes the RTM service payload.
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
      }
    };
    ServiceRtm.kPrivilegeLogin = 1;
    var kStreamingServiceType = 3;
    var ServiceStreaming = class extends Service {
      // Creates a Streaming service for a channel and numeric user ID or string account.
      constructor(channelName = "", account = "") {
        super(kStreamingServiceType);
        this.__channel_name = channelName;
        this.__account = account === 0 ? "" : `${account}`;
      }
      // Serializes the Streaming service payload.
      pack() {
        const buffer = new ByteBuf().putString(this.__channel_name).putString(this.__account);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      // Deserializes the Streaming service payload.
      unpack(buffer) {
        const reader = super.unpack(buffer);
        this.__channel_name = reader.getString();
        this.__account = reader.getString();
        return reader;
      }
    };
    ServiceStreaming.kPrivilegePublishMixStream = 1;
    ServiceStreaming.kPrivilegePublishRawStream = 2;
    var kFpaServiceType = 4;
    var ServiceFpa = class extends Service {
      // Creates an FPA service.
      constructor() {
        super(kFpaServiceType);
      }
      // Serializes the FPA service payload.
      pack() {
        return super.pack();
      }
      // Deserializes the FPA service payload.
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        return bufReader;
      }
    };
    ServiceFpa.kPrivilegeLogin = 1;
    var kConvoAIServiceType = 9;
    var ServiceConvoAI = class extends Service {
      // Creates a ConvoAI service.
      constructor() {
        super(kConvoAIServiceType);
      }
      // Serializes the ConvoAI service payload.
      pack() {
        return super.pack();
      }
      // Deserializes the ConvoAI service payload.
      unpack(buffer) {
        return super.unpack(buffer);
      }
    };
    var kSttServiceType = 10;
    var ServiceStt = class extends Service {
      // Creates an STT service.
      constructor() {
        super(kSttServiceType);
      }
      // Serializes the STT service payload.
      pack() {
        return super.pack();
      }
      // Deserializes the STT service payload.
      unpack(buffer) {
        return super.unpack(buffer);
      }
    };
    var kChatServiceType = 5;
    var ServiceChat = class extends Service {
      // Creates a Chat service for a user ID.
      constructor(user_id) {
        super(kChatServiceType);
        this.__user_id = user_id || "";
      }
      // Serializes the Chat service payload.
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__user_id);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      // Deserializes the Chat service payload.
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__user_id = bufReader.getString();
        return bufReader;
      }
    };
    ServiceChat.kPrivilegeUser = 1;
    ServiceChat.kPrivilegeApp = 2;
    var kFCdnServiceType = 6;
    var ServiceFCdn = class extends Service {
      // Creates an FCDN service for a channel and numeric user ID or string account.
      constructor(channelName = "", account = "") {
        super(kFCdnServiceType);
        this.__channel_name = channelName;
        this.__account = account === 0 ? "" : `${account}`;
      }
      // Serializes the FCDN service payload.
      pack() {
        const buffer = new ByteBuf().putString(this.__channel_name).putString(this.__account);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      // Deserializes the FCDN service payload.
      unpack(buffer) {
        const reader = super.unpack(buffer);
        this.__channel_name = reader.getString();
        this.__account = reader.getString();
        return reader;
      }
    };
    ServiceFCdn.kPrivilegePublish = 1;
    ServiceFCdn.kPrivilegePlay = 2;
    var kApaasServiceType = 7;
    var ServiceApaas = class extends Service {
      // Creates an APaaS service for a room, user, and role.
      constructor(roomUuid, userUuid, role) {
        super(kApaasServiceType);
        this.__room_uuid = roomUuid || "";
        this.__user_uuid = userUuid || "";
        this.__role = role || -1;
      }
      // Serializes the APaaS service payload.
      pack() {
        let buffer = new ByteBuf();
        buffer.putString(this.__room_uuid);
        buffer.putString(this.__user_uuid);
        buffer.putInt16(this.__role);
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      // Deserializes the APaaS service payload.
      unpack(buffer) {
        let bufReader = super.unpack(buffer);
        this.__room_uuid = bufReader.getString();
        this.__user_uuid = bufReader.getString();
        this.__role = bufReader.getInt16();
        return bufReader;
      }
    };
    ServiceApaas.PRIVILEGE_ROOM_USER = 1;
    ServiceApaas.PRIVILEGE_USER = 2;
    ServiceApaas.PRIVILEGE_APP = 3;
    var Rtm2Permissions = class {
      // Creates an empty RTM2 permission set.
      constructor() {
        this.details = {};
      }
      // Adds or replaces resources for a resource and permission type.
      add(resourceType, permissionType, resources) {
        if (!this.details[resourceType]) {
          this.details[resourceType] = {};
        }
        this.details[resourceType][permissionType] = Array.from(resources);
      }
    };
    Rtm2Permissions.kMessageChannels = 0;
    Rtm2Permissions.kStreamChannels = 1;
    Rtm2Permissions.kGroupChannels = 2;
    Rtm2Permissions.kServerGroups = 3;
    Rtm2Permissions.kUsers = 4;
    Rtm2Permissions.kRead = 0;
    Rtm2Permissions.kWrite = 1;
    var kRtm2ServiceType = 8;
    var ServiceRtm2 = class extends Service {
      // Creates an RTM2 service for a user and permission set.
      constructor(userId, permissions) {
        super(kRtm2ServiceType);
        this.__user_id = userId === 0 || userId == null ? "" : String(userId);
        this.__permissions = permissions || new Rtm2Permissions();
      }
      // Serializes the RTM2 service payload.
      pack() {
        const buffer = new ByteBuf().putString(this.__user_id);
        const resourceTypes = Object.keys(this.__permissions.details).map(Number).sort((left, right) => left - right);
        buffer.putUint16(resourceTypes.length);
        resourceTypes.forEach((resourceType) => {
          const permissionMap = this.__permissions.details[resourceType];
          const permissionTypes = Object.keys(permissionMap).map(Number).sort((left, right) => left - right);
          buffer.putUint16(resourceType).putUint16(permissionTypes.length);
          permissionTypes.forEach((permissionType) => {
            const resources = permissionMap[permissionType];
            buffer.putUint16(permissionType).putUint16(resources.length);
            resources.forEach((resource) => buffer.putString(resource));
          });
        });
        return Buffer.concat([super.pack(), buffer.pack()]);
      }
      // Deserializes the RTM2 service payload.
      unpack(buffer) {
        const reader = super.unpack(buffer);
        this.__user_id = reader.getString();
        this.__permissions = new Rtm2Permissions();
        const resourceTypeCount = reader.getUint16();
        for (let i = 0; i < resourceTypeCount; i++) {
          const resourceType = reader.getUint16();
          const permissionCount = reader.getUint16();
          for (let j = 0; j < permissionCount; j++) {
            const permissionType = reader.getUint16();
            const resourceCount = reader.getUint16();
            const resources = [];
            for (let k = 0; k < resourceCount; k++) {
              resources.push(reader.getString().toString());
            }
            this.__permissions.add(resourceType, permissionType, resources);
          }
        }
        return reader;
      }
    };
    ServiceRtm2.kPrivilegeLogin = 1;
    var AccessToken2 = class _AccessToken2 {
      // Creates a token builder or an empty token parser.
      constructor(appId, appCertificate, issueTs, expire) {
        this.appId = appId;
        this.appCertificate = appCertificate;
        this.issueTs = issueTs || (/* @__PURE__ */ new Date()).getTime() / 1e3;
        this.expire = expire;
        this.salt = Math.floor(Math.random() * 99999999) + 1;
        this.services = [];
        this.__signature = Buffer.alloc(0);
        this.__signing_info = Buffer.alloc(0);
        this.__parsed = false;
      }
      // Derives the signing key with the stored or supplied App Certificate.
      __signing(appCertificate = this.appCertificate) {
        let signing = encodeHMac(new ByteBuf().putUint32(this.issueTs).pack(), appCertificate);
        signing = encodeHMac(new ByteBuf().putUint32(this.salt).pack(), signing);
        return signing;
      }
      // Validates the fields required to build a token.
      __build_check() {
        const { appId, appCertificate, services } = this;
        if (!isUuid(appId) || !isUuid(appCertificate)) {
          return false;
        }
        if (services.length === 0) {
          return false;
        }
        return true;
      }
      // Returns services in stable type order while preserving duplicate insertion order.
      __services_for_packing() {
        return this.services.map((service, index) => ({ service, index })).sort((left, right) => {
          const typeDifference = left.service.service_type() - right.service.service_type();
          return typeDifference || left.index - right.index;
        }).map((entry) => entry.service);
      }
      // Adds a service without replacing services of the same type.
      add_service(service) {
        this.services.push(service);
      }
      // Returns all services of the requested type in insertion or token order.
      getServices(serviceType) {
        return this.services.filter((service) => service.service_type() === serviceType);
      }
      // Builds a Token007 token containing all added services.
      build() {
        if (!this.__build_check()) {
          return "";
        }
        let signing = this.__signing();
        const services = this.__services_for_packing();
        let signing_info = new ByteBuf().putString(this.appId).putUint32(this.issueTs).putUint32(this.expire).putUint32(this.salt).putUint16(services.length).pack();
        services.forEach((service) => {
          signing_info = Buffer.concat([signing_info, service.pack()]);
        });
        let signature = encodeHMac(signing, signing_info);
        let content = Buffer.concat([new ByteBuf().putString(signature).pack(), signing_info]);
        let compressed = zlib.deflateSync(content);
        return `${getVersion()}${Buffer.from(compressed).toString("base64")}`;
      }
      // Parses known services and retains the original bytes for signature verification.
      from_string(origin_token) {
        this.appId = "";
        this.issueTs = 0;
        this.expire = 0;
        this.salt = 0;
        this.services = [];
        this.__signature = Buffer.alloc(0);
        this.__signing_info = Buffer.alloc(0);
        this.__parsed = false;
        if (typeof origin_token !== "string" || origin_token.length < VERSION_LENGTH) {
          return false;
        }
        const origin_version = origin_token.substring(0, VERSION_LENGTH);
        if (origin_version !== getVersion()) {
          return false;
        }
        try {
          const origin_content = origin_token.substring(VERSION_LENGTH);
          const buffer = zlib.inflateSync(Buffer.from(origin_content, "base64"));
          const bufferReader = new ReadByteBuf(buffer);
          this.__signature = Buffer.from(bufferReader.getString());
          this.__signing_info = Buffer.from(bufferReader.pack());
          this.services = [];
          this.appId = bufferReader.getString();
          this.issueTs = bufferReader.getUint32();
          this.expire = bufferReader.getUint32();
          this.salt = bufferReader.getUint32();
          const service_count = bufferReader.getUint16();
          let remainBuf = bufferReader.pack();
          for (let i = 0; i < service_count; i++) {
            const bufferReaderService = new ReadByteBuf(remainBuf);
            const service_type = bufferReaderService.getUint16();
            const ServiceClass = _AccessToken2.kServices[service_type];
            if (!ServiceClass) {
              this.__parsed = true;
              return true;
            }
            const service = new ServiceClass();
            remainBuf = service.unpack(bufferReaderService.pack()).pack();
            this.add_service(service);
          }
        } catch (error) {
          return false;
        }
        this.__parsed = true;
        return true;
      }
      // Verifies the signature of a successfully parsed token.
      verifySignature(appCertificate) {
        if (!this.__parsed || this.__signature.length === 0 || this.__signing_info.length === 0 || !isUuid(this.appId) || !isUuid(appCertificate)) {
          return false;
        }
        const signature = encodeHMac(this.__signing(appCertificate), this.__signing_info);
        return this.__signature.length === signature.length && crypto.timingSafeEqual(this.__signature, signature);
      }
    };
    var encodeHMac = function(key, message) {
      return crypto.createHmac("sha256", key).update(message).digest();
    };
    var ByteBuf = function() {
      var that = {
        buffer: Buffer.alloc(1024),
        position: 0
      };
      that.buffer.fill(0);
      var ensureCapacity = function(additionalLength) {
        const requiredLength = that.position + additionalLength;
        if (requiredLength <= that.buffer.length) {
          return;
        }
        let capacity = that.buffer.length;
        while (capacity < requiredLength) {
          capacity *= 2;
        }
        const expanded = Buffer.alloc(capacity);
        that.buffer.copy(expanded, 0, 0, that.position);
        that.buffer = expanded;
      };
      that.pack = function() {
        var out = Buffer.alloc(that.position);
        that.buffer.copy(out, 0, 0, out.length);
        return out;
      };
      that.putUint16 = function(v) {
        ensureCapacity(2);
        that.buffer.writeUInt16LE(v, that.position);
        that.position += 2;
        return that;
      };
      that.putUint32 = function(v) {
        ensureCapacity(4);
        that.buffer.writeUInt32LE(v, that.position);
        that.position += 4;
        return that;
      };
      that.putInt32 = function(v) {
        ensureCapacity(4);
        that.buffer.writeInt32LE(v, that.position);
        that.position += 4;
        return that;
      };
      that.putInt16 = function(v) {
        ensureCapacity(2);
        that.buffer.writeInt16LE(v, that.position);
        that.position += 2;
        return that;
      };
      that.putBytes = function(bytes) {
        that.putUint16(bytes.length);
        ensureCapacity(bytes.length);
        bytes.copy(that.buffer, that.position);
        that.position += bytes.length;
        return that;
      };
      that.putString = function(str) {
        return that.putBytes(Buffer.from(str));
      };
      that.putTreeMap = function(map) {
        if (!map) {
          that.putUint16(0);
          return that;
        }
        that.putUint16(Object.keys(map).length);
        for (var key in map) {
          that.putUint16(key);
          that.putString(map[key]);
        }
        return that;
      };
      that.putTreeMapUInt32 = function(map) {
        if (!map) {
          that.putUint16(0);
          return that;
        }
        that.putUint16(Object.keys(map).length);
        for (var key in map) {
          that.putUint16(key);
          that.putUint32(map[key]);
        }
        return that;
      };
      return that;
    };
    var ReadByteBuf = function(bytes) {
      var that = {
        buffer: bytes,
        position: 0
      };
      that.getUint16 = function() {
        var ret = that.buffer.readUInt16LE(that.position);
        that.position += 2;
        return ret;
      };
      that.getUint32 = function() {
        var ret = that.buffer.readUInt32LE(that.position);
        that.position += 4;
        return ret;
      };
      that.getInt16 = function() {
        var ret = that.buffer.readUInt16LE(that.position);
        that.position += 2;
        return ret;
      };
      that.getString = function() {
        var len = that.getUint16();
        var out = Buffer.alloc(len);
        that.buffer.copy(out, 0, that.position, that.position + len);
        that.position += len;
        return out;
      };
      that.getTreeMapUInt32 = function() {
        var map = {};
        var len = that.getUint16();
        for (var i = 0; i < len; i++) {
          var key = that.getUint16();
          var value = that.getUint32();
          map[key] = value;
        }
        return map;
      };
      that.pack = function() {
        const length = that.buffer.length - that.position;
        const out = Buffer.alloc(length);
        that.buffer.copy(out, 0, that.position);
        return out;
      };
      return that;
    };
    AccessToken2.kServices = {};
    AccessToken2.kServices[kApaasServiceType] = ServiceApaas;
    AccessToken2.kServices[kChatServiceType] = ServiceChat;
    AccessToken2.kServices[kFCdnServiceType] = ServiceFCdn;
    AccessToken2.kServices[kFpaServiceType] = ServiceFpa;
    AccessToken2.kServices[kRtcServiceType] = ServiceRtc;
    AccessToken2.kServices[kRtmServiceType] = ServiceRtm;
    AccessToken2.kServices[kRtm2ServiceType] = ServiceRtm2;
    AccessToken2.kServices[kStreamingServiceType] = ServiceStreaming;
    AccessToken2.kServices[kConvoAIServiceType] = ServiceConvoAI;
    AccessToken2.kServices[kSttServiceType] = ServiceStt;
    module.exports = {
      AccessToken2,
      kApaasServiceType,
      kChatServiceType,
      kConvoAIServiceType,
      kFCdnServiceType,
      kFpaServiceType,
      kRtcServiceType,
      kRtmServiceType,
      kRtm2ServiceType,
      kSttServiceType,
      kStreamingServiceType,
      Rtm2Permissions,
      Service,
      ServiceApaas,
      ServiceChat,
      ServiceConvoAI,
      ServiceFCdn,
      ServiceFpa,
      ServiceRtc,
      ServiceRtm,
      ServiceRtm2,
      ServiceStt,
      ServiceStreaming
    };
  }
});

// node_modules/agora-token/src/ApaasTokenBuilder.js
var require_ApaasTokenBuilder = __commonJS({
  "node_modules/agora-token/src/ApaasTokenBuilder.js"(exports, module) {
    var md5 = require_md5();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceApaas = require_AccessToken2().ServiceApaas;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var ApaasTokenBuilder = class {
      /**
       * build user room token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param roomUuid          The room's id, must be unique.
       * @param userUuid          The user's id, must be unique.
       * @param role              The user's role.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as
       *                          600(seconds). This value is the whole token expiration and the service
       *                          privilege expiration. The whole token is invalid after this time.
       * @return The user room token.
       */
      static buildRoomUserToken(appId, appCertificate, roomUuid, userUuid, role, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let chatUserId = md5(userUuid);
        let apaasService = new ServiceApaas(roomUuid, userUuid, role);
        accessToken.add_service(apaasService);
        let rtmService = new ServiceRtm(userUuid);
        rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        accessToken.add_service(rtmService);
        let chatService = new ServiceChat(chatUserId);
        chatService.add_privilege(ServiceChat.kPrivilegeUser, expire);
        accessToken.add_service(chatService);
        return accessToken.build();
      }
      /**
       * build user token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param userUuid          The user's id, must be unique.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as
       *                          600(seconds). This value is the whole token expiration and the service
       *                          privilege expiration. The whole token is invalid after this time.
       * @return The user token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas("", userUuid);
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_USER, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
      /**
       * build app token
       * @param appId          The App ID issued to you by Agora. Apply for a new App ID from
       *                       Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       *                       the Agora Dashboard. See Get an App Certificate.
       * @param expire         represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                       Agora Service within 10 minutes after the token is generated, set expire as
       *                       600(seconds). This value is the whole token expiration and the service privilege
       *                       expiration. The whole token is invalid after this time.
       * @return The app token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas();
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_APP, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
    };
    module.exports.ApaasTokenBuilder = ApaasTokenBuilder;
  }
});

// node_modules/agora-token/src/ChatTokenBuilder.js
var require_ChatTokenBuilder = __commonJS({
  "node_modules/agora-token/src/ChatTokenBuilder.js"(exports) {
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ChatTokenBuilder = class {
      /**
       * Build the Chat user token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param userUuid The user's id, must be unique.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds). This value is
       * the whole token expiration and the service privilege expiration. The whole token is invalid after this
       * time.
       * @return The Chat User token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        const token = new AccessToken(appId, appCertificate, null, expire);
        const serviceChat = new ServiceChat(userUuid);
        serviceChat.add_privilege(ServiceChat.kPrivilegeUser, expire);
        token.add_service(serviceChat);
        return token.build();
      }
      /**
       * Build the Chat App token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds). This value is
       * the whole token expiration and the service privilege expiration. The whole token is invalid after this
       * time.
       * @return The Chat App token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        const token = new AccessToken(appId, appCertificate, null, expire);
        const serviceChat = new ServiceChat();
        serviceChat.add_privilege(ServiceChat.kPrivilegeApp, expire);
        token.add_service(serviceChat);
        return token.build();
      }
    };
    exports.ChatTokenBuilder = ChatTokenBuilder;
  }
});

// node_modules/agora-token/src/RtcTokenBuilder2.js
var require_RtcTokenBuilder2 = __commonJS({
  "node_modules/agora-token/src/RtcTokenBuilder2.js"(exports, module) {
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceRtc = require_AccessToken2().ServiceRtc;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var Role = {
      /**
       * RECOMMENDED. Use this role for a voice/video call or a live broadcast, if
       * your scenario does not require authentication for
       * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
       */
      PUBLISHER: 1,
      /**
       * Only use this role if your scenario require authentication for
       * [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication).
       *
       * @note In order for this role to take effect, please contact our support team
       * to enable authentication for Hosting-in for you. Otherwise, Role_Subscriber
       * still has the same privileges as Role_Publisher.
       */
      SUBSCRIBER: 2
    };
    var RtcTokenBuilder2 = class {
      /**
       * Builds an RTC token using an Integer uid.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} uid User ID. A 32-bit unsigned integer with a value ranging from 1 to (2^32-1).
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire represented by the number of seconds elapsed since now. If, for example, you
       * want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as
       * 600(seconds). This is the whole token expiration. The whole token is invalid after this time, even if a
       * privilege expiration time is later.
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you
       * want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds). This value must not
       * exceed the token expiration value; otherwise, the privilege is limited by the token expiration time.
       * @return The RTC Token.
       */
      static buildTokenWithUid(appId, appCertificate, channelName, uid, role, tokenExpire, privilegeExpire = 0) {
        return this.buildTokenWithUserAccount(
          appId,
          appCertificate,
          channelName,
          uid,
          role,
          tokenExpire,
          privilegeExpire
        );
      }
      /**
       * Builds an RTC token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The user account.
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire represented by the number of seconds elapsed since now. If, for example, you
       * want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as
       * 600(seconds). This is the whole token expiration. The whole token is invalid after this time, even if a
       * privilege expiration time is later.
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you
       * want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds). This value must not
       * exceed the token expiration value; otherwise, the privilege is limited by the token expiration time.
       * @return The RTC Token.
       */
      static buildTokenWithUserAccount(appId, appCertificate, channelName, account, role, tokenExpire, privilegeExpire = 0) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);
        return token.build();
      }
      /**
       * Generates an RTC token with the specified privilege.
       *
       * This method supports generating a token with the following privileges:
       * - Joining an RTC channel.
       * - Publishing audio in an RTC channel.
       * - Publishing video in an RTC channel.
       * - Publishing data streams in an RTC channel.
       *
       * The privileges for publishing audio, video, and data streams in an RTC channel apply only if you have
       * enabled co-host authentication.
       *
       * A user can have multiple privileges. Each privilege is valid for a maximum of 24 hours.
       * The SDK triggers the onTokenPrivilegeWillExpire and onRequestToken callbacks when the token is about to expire
       * or has expired. The callbacks do not report the specific privilege affected, and you need to maintain
       * the respective timestamp for each privilege in your app logic. After receiving the callback, you need
       * to generate a new token, and then call renewToken to pass the new token to the SDK, or call joinChannel to re-join
       * the channel.
       *
       * @note
       * Agora recommends setting a reasonable timestamp for each privilege according to your scenario.
       * Suppose the expiration timestamp for joining the channel is set earlier than that for publishing audio.
       * When the token for joining the channel expires, the user is immediately kicked off the RTC channel
       * and cannot publish any audio stream, even though the timestamp for publishing audio has not expired.
       *
       * @param appId The App ID of your Agora project.
       * @param appCertificate The App Certificate of your Agora project.
       * @param channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param uid The user ID. A 32-bit unsigned integer with a value range from 1 to (2^32 - 1). It must be unique. Set uid as 0, if you do not want to authenticate the user ID, that is, any uid from the app client can join the channel.
       * @param tokenExpire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds). This is
       * the whole token expiration. The whole token is invalid after this time, even if a privilege expiration
       * time is later.
       * @param joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set
       * joinChannelPrivilegeExpire as 600(seconds). This value must not exceed the token expiration value;
       * otherwise, the privilege is limited by the token expiration time.
       * @param pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire
       * as 600(seconds). This value must not exceed the token expiration value; otherwise, the privilege is
       * limited by the token expiration time.
       * @param pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire
       * as 600(seconds). This value must not exceed the token expiration value; otherwise, the privilege is
       * limited by the token expiration time.
       * @param pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set
       * pubDataStreamPrivilegeExpire as 600(seconds). This value must not exceed the token expiration value;
       * otherwise, the privilege is limited by the token expiration time.
       * @return The RTC Token
       */
      static buildTokenWithUidAndPrivilege(appId, appCertificate, channelName, uid, tokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire) {
        return this.BuildTokenWithUserAccountAndPrivilege(
          appId,
          appCertificate,
          channelName,
          uid,
          tokenExpire,
          joinChannelPrivilegeExpire,
          pubAudioPrivilegeExpire,
          pubVideoPrivilegeExpire,
          pubDataStreamPrivilegeExpire
        );
      }
      /**
       * Generates an RTC token with the specified privilege.
       *
       * This method supports generating a token with the following privileges:
       * - Joining an RTC channel.
       * - Publishing audio in an RTC channel.
       * - Publishing video in an RTC channel.
       * - Publishing data streams in an RTC channel.
       *
       * The privileges for publishing audio, video, and data streams in an RTC channel apply only if you have
       * enabled co-host authentication.
       *
       * A user can have multiple privileges. Each privilege is valid for a maximum of 24 hours.
       * The SDK triggers the onTokenPrivilegeWillExpire and onRequestToken callbacks when the token is about to expire
       * or has expired. The callbacks do not report the specific privilege affected, and you need to maintain
       * the respective timestamp for each privilege in your app logic. After receiving the callback, you need
       * to generate a new token, and then call renewToken to pass the new token to the SDK, or call joinChannel to re-join
       * the channel.
       *
       * @note
       * Agora recommends setting a reasonable timestamp for each privilege according to your scenario.
       * Suppose the expiration timestamp for joining the channel is set earlier than that for publishing audio.
       * When the token for joining the channel expires, the user is immediately kicked off the RTC channel
       * and cannot publish any audio stream, even though the timestamp for publishing audio has not expired.
       *
       * @param appId The App ID of your Agora project.
       * @param appCertificate The App Certificate of your Agora project.
       * @param channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param userAccount The user account.
       * @param tokenExpire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set tokenExpire as 600(seconds). This is
       * the whole token expiration. The whole token is invalid after this time, even if a privilege expiration
       * time is later.
       * @param joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set
       * joinChannelPrivilegeExpire as 600(seconds). This value must not exceed the token expiration value;
       * otherwise, the privilege is limited by the token expiration time.
       * @param pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire
       * as 600(seconds). This value must not exceed the token expiration value; otherwise, the privilege is
       * limited by the token expiration time.
       * @param pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire
       * as 600(seconds). This value must not exceed the token expiration value; otherwise, the privilege is
       * limited by the token expiration time.
       * @param pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set
       * pubDataStreamPrivilegeExpire as 600(seconds). This value must not exceed the token expiration value;
       * otherwise, the privilege is limited by the token expiration time.
       * @return The RTC Token.
       */
      static BuildTokenWithUserAccountAndPrivilege(appId, appCertificate, channelName, account, tokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        token.add_service(serviceRtc);
        return token.build();
      }
      /**
       * Build an RTC and RTM token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The user account.
       * @param {*} role See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} tokenExpire represented by the number of seconds elapsed since now. If, for example, you
       * want to access the Agora Service within 10 minutes after the token is generated, set tokenExpire as
       * 600(seconds). This is the whole token expiration. The whole token is invalid after this time, even if a
       * privilege expiration time is later.
       * @param {*} privilegeExpire represented by the number of seconds elapsed since now. If, for example, you
       * want to enable your privilege for 10 minutes, set privilegeExpire as 600(seconds). This value must not
       * exceed the token expiration value; otherwise, the privilege is limited by the token expiration time.
       * @return The RTC and RTM Token.
       */
      static buildTokenWithRtm(appId, appCertificate, channelName, account, role, tokenExpire, privilegeExpire = 0) {
        let token = new AccessToken(appId, appCertificate, 0, tokenExpire);
        let serviceRtc = new ServiceRtc(channelName, account);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpire);
        if (role == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpire);
        }
        token.add_service(serviceRtc);
        let serviceRtm = new ServiceRtm(account);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, tokenExpire);
        token.add_service(serviceRtm);
        return token.build();
      }
      /**
       * Build an RTC and RTM token with account.
       * @param {*} appId  The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the AgoraRTC session in the string format. The string length must be less than 64 bytes. Supported character scopes are:
       * - The 26 lowercase English letters: a to z.
       * - The 26 uppercase English letters: A to Z.
       * - The 10 digits: 0 to 9.
       * - The space.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} rtcAccount The RTC user's account, max length is 255 Bytes.
       * @param {*} rtcRole See #userRole.
       * - Role.PUBLISHER; RECOMMENDED. Use this role for a voice/video call or a live broadcast.
       * - Role.SUBSCRIBER: ONLY use this role if your live-broadcast scenario requires authentication for [Co-host](https://docs.agora.io/en/video-calling/get-started/authentication-workflow?#co-host-token-authentication). In order for this role to take effect, please contact our support team to enable authentication for Co-host for you. Otherwise, Role_Subscriber still has the same privileges as Role_Publisher.
       * @param {*} rtcTokenExpire represented by the number of seconds elapsed since now. If, for example, you
       * want to access the Agora Service within 10 minutes after the token is generated, set rtcTokenExpire as
       * 600(seconds). This is the whole token expiration. The whole token is invalid after this time, even if a
       * privilege expiration time is later.
       * @param {*} joinChannelPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to join channel and expect stay in the channel for 10 minutes, set
       * joinChannelPrivilegeExpire as 600(seconds). This value must not exceed the token expiration value;
       * otherwise, the privilege is limited by the token expiration time.
       * @param {*} pubAudioPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish audio privilege for 10 minutes, set pubAudioPrivilegeExpire
       * as 600(seconds). This value must not exceed the token expiration value; otherwise, the privilege is
       * limited by the token expiration time.
       * @param {*} pubVideoPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish video privilege for 10 minutes, set pubVideoPrivilegeExpire
       * as 600(seconds). This value must not exceed the token expiration value; otherwise, the privilege is
       * limited by the token expiration time.
       * @param {*} pubDataStreamPrivilegeExpire represented by the number of seconds elapsed since now.
       * If, for example, you want to enable publish data stream privilege for 10 minutes, set
       * pubDataStreamPrivilegeExpire as 600(seconds). This value must not exceed the token expiration value;
       * otherwise, the privilege is limited by the token expiration time.
       * @param {*} rtmUserId: The RTM user's account, max length is 255 Bytes.
       * @param {*} rtmTokenExpire: represented by the number of seconds elapsed since now. If, for example,
       * you want to access the Agora Service within 10 minutes after the token is generated, set rtmTokenExpire
       * as 600(seconds). This value must not exceed the RTC token expiration value; otherwise, the RTM login
       * privilege is limited by the token expiration time.
       * * @return The RTC and RTM Token.
       */
      static buildTokenWithRtm2(appId, appCertificate, channelName, rtcAccount, rtcRole, rtcTokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire, rtmUserId, rtmTokenExpire) {
        let token = new AccessToken(appId, appCertificate, 0, rtcTokenExpire);
        let serviceRtc = new ServiceRtc(channelName, rtcAccount);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        if (rtcRole == Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        }
        token.add_service(serviceRtc);
        let serviceRtm = new ServiceRtm(rtmUserId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, rtmTokenExpire);
        token.add_service(serviceRtm);
        return token.build();
      }
    };
    module.exports.RtcTokenBuilder = RtcTokenBuilder2;
    module.exports.Role = Role;
  }
});

// node_modules/agora-token/src/ConvoAITokenBuilder.js
var require_ConvoAITokenBuilder = __commonJS({
  "node_modules/agora-token/src/ConvoAITokenBuilder.js"(exports, module) {
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceConvoAI = require_AccessToken2().ServiceConvoAI;
    var ServiceRtc = require_AccessToken2().ServiceRtc;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var Role = require_RtcTokenBuilder2().Role;
    var ConvoAITokenBuilder = class {
      /**
       * Builds a ConvoAI token with RTC and RTM services.
       * @param {*} appId The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The account used by both RTC and RTM, max length is 255 bytes.
       * @param {*} tokenExpire Represented by the number of seconds elapsed since now. Defaults to 86400. This
       * is the whole token expiration. The whole token is invalid after this time, even if a privilege
       * expiration time is later.
       * @param {*} privilegeExpire Represented by the number of seconds elapsed since now. Defaults to 0. This
       * value must not exceed tokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @return The ConvoAI token.
       */
      static buildToken(appId, appCertificate, channelName, account, tokenExpire = 86400, privilegeExpire = 0) {
        return this.buildTokenWithPrivilege(
          appId,
          appCertificate,
          channelName,
          account,
          Role.PUBLISHER,
          tokenExpire,
          privilegeExpire,
          privilegeExpire,
          privilegeExpire,
          privilegeExpire,
          account,
          privilegeExpire
        );
      }
      /**
       * Builds a ConvoAI token with RTC and RTM services.
       * @param {*} appId The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} rtcAccount The RTC user's account, max length is 255 bytes.
       * @param {*} rtcRole Role.PUBLISHER for a broadcaster or Role.SUBSCRIBER for an audience member.
       * @param {*} rtcTokenExpire Represented by the number of seconds elapsed since now. This is the whole
       * token expiration. The whole token is invalid after this time, even if a privilege expiration time is
       * later.
       * @param {*} joinChannelPrivilegeExpire Represented by the number of seconds elapsed since now. This
       * value must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} pubAudioPrivilegeExpire Represented by the number of seconds elapsed since now. This value
       * must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} pubVideoPrivilegeExpire Represented by the number of seconds elapsed since now. This value
       * must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} pubDataStreamPrivilegeExpire Represented by the number of seconds elapsed since now. This
       * value must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} rtmUserId The RTM user's account, max length is 255 bytes.
       * @param {*} rtmTokenExpire Represented by the number of seconds elapsed since now. This value must not
       * exceed rtcTokenExpire; otherwise, the RTM login privilege is limited by the token expiration time.
       * @return The ConvoAI token.
       */
      static buildTokenWithPrivilege(appId, appCertificate, channelName, rtcAccount, rtcRole, rtcTokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire, rtmUserId, rtmTokenExpire) {
        const token = new AccessToken(appId, appCertificate, 0, rtcTokenExpire);
        const serviceRtc = new ServiceRtc(channelName, rtcAccount);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        if (rtcRole === Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        }
        token.add_service(serviceRtc);
        const serviceRtm = new ServiceRtm(rtmUserId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, rtmTokenExpire);
        token.add_service(serviceRtm);
        token.add_service(new ServiceConvoAI());
        return token.build();
      }
    };
    module.exports = {
      ConvoAITokenBuilder
    };
  }
});

// node_modules/agora-token/src/EducationTokenBuilder.js
var require_EducationTokenBuilder = __commonJS({
  "node_modules/agora-token/src/EducationTokenBuilder.js"(exports, module) {
    var md5 = require_md5();
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceApaas = require_AccessToken2().ServiceApaas;
    var ServiceChat = require_AccessToken2().ServiceChat;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var EducationTokenBuilder = class {
      /**
       * build user room token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param roomUuid          The room's id, must be unique.
       * @param userUuid          The user's id, must be unique.
       * @param role              The user's role.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as
       *                          600(seconds). This value is the whole token expiration and the service
       *                          privilege expiration. The whole token is invalid after this time.
       * @return The user room token.
       */
      static buildRoomUserToken(appId, appCertificate, roomUuid, userUuid, role, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let chatUserId = md5(userUuid);
        let apaasService = new ServiceApaas(roomUuid, userUuid, role);
        accessToken.add_service(apaasService);
        let rtmService = new ServiceRtm(userUuid);
        rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        accessToken.add_service(rtmService);
        let chatService = new ServiceChat(chatUserId);
        chatService.add_privilege(ServiceChat.kPrivilegeUser, expire);
        accessToken.add_service(chatService);
        return accessToken.build();
      }
      /**
       * build user token
       * @param appId             The App ID issued to you by Agora. Apply for a new App ID from
       *                          Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate    Certificate of the application that you registered in
       *                          the Agora Dashboard. See Get an App Certificate.
       * @param userUuid          The user's id, must be unique.
       * @param expire            represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                          Agora Service within 10 minutes after the token is generated, set expire as
       *                          600(seconds). This value is the whole token expiration and the service
       *                          privilege expiration. The whole token is invalid after this time.
       * @return The user token.
       */
      static buildUserToken(appId, appCertificate, userUuid, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas("", userUuid);
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_USER, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
      /**
       * build app token
       * @param appId          The App ID issued to you by Agora. Apply for a new App ID from
       *                       Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       *                       the Agora Dashboard. See Get an App Certificate.
       * @param expire         represented by the number of seconds elapsed since now. If, for example, you want to access the
       *                       Agora Service within 10 minutes after the token is generated, set expire as
       *                       600(seconds). This value is the whole token expiration and the service privilege
       *                       expiration. The whole token is invalid after this time.
       * @return The app token.
       */
      static buildAppToken(appId, appCertificate, expire) {
        let accessToken = new AccessToken(appId, appCertificate, 0, expire);
        let apaasService = new ServiceApaas();
        apaasService.add_privilege(ServiceApaas.PRIVILEGE_APP, expire);
        accessToken.add_service(apaasService);
        return accessToken.build();
      }
    };
    module.exports.EducationTokenBuilder = EducationTokenBuilder;
  }
});

// node_modules/agora-token/src/FpaTokenBuilder.js
var require_FpaTokenBuilder = __commonJS({
  "node_modules/agora-token/src/FpaTokenBuilder.js"(exports, module) {
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceFpa = require_AccessToken2().ServiceFpa;
    var FpaTokenBuilder = class {
      /**
       * Build the FPA token.
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @return The FPA token. The token expires 24 hours after generation.
       */
      static buildToken(appId, appCertificate) {
        let token = new AccessToken(appId, appCertificate, 0, 24 * 3600);
        let serviceFpa = new ServiceFpa();
        serviceFpa.add_privilege(ServiceFpa.kPrivilegeLogin, 0);
        token.add_service(serviceFpa);
        return token.build();
      }
    };
    module.exports.FpaTokenBuilder = FpaTokenBuilder;
  }
});

// node_modules/agora-token/src/RtmTokenBuilder2.js
var require_RtmTokenBuilder2 = __commonJS({
  "node_modules/agora-token/src/RtmTokenBuilder2.js"(exports, module) {
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var ServiceRtm2 = require_AccessToken2().ServiceRtm2;
    var RtmTokenBuilder = class {
      /**
       * Build the RTM token.
       *
       * @param appId The App ID issued to you by Agora. Apply for a new App ID from
       * Agora Dashboard if it is missing from your kit. See Get an App ID.
       * @param appCertificate Certificate of the application that you registered in
       * the Agora Dashboard. See Get an App Certificate.
       * @param userId The user's account, max length is 64 Bytes.
       * @param expire represented by the number of seconds elapsed since now. If, for example, you want to access the
       * Agora Service within 10 minutes after the token is generated, set expire as 600(seconds). This value is
       * the whole token expiration and the service privilege expiration. The whole token is invalid after this
       * time.
       * @return The RTM token.
       */
      static buildToken(appId, appCertificate, userId, expire) {
        let token = new AccessToken(appId, appCertificate, null, expire);
        let serviceRtm = new ServiceRtm(userId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, expire);
        token.add_service(serviceRtm);
        return token.build();
      }
      /**
       * Build an RTM2 token with resource-level permissions.
       *
       * This special interface requires Agora assistance for proper usage.
       *
       * @param appId The App ID issued to you by Agora.
       * @param appCertificate Certificate of the application registered in the Agora Dashboard.
       * @param userId The user's account, max length is 64 bytes.
       * @param permissions The RTM2 resource-level permissions.
       * @param expire The number of seconds from now before the token expires. This value is the whole token
       * expiration and the service privilege expiration. The whole token is invalid after this time.
       * @return The RTM2 token.
       */
      static buildTokenWithPermissions(appId, appCertificate, userId, permissions, expire) {
        const token = new AccessToken(appId, appCertificate, null, expire);
        const serviceRtm2 = new ServiceRtm2(userId, permissions);
        serviceRtm2.add_privilege(ServiceRtm2.kPrivilegeLogin, expire);
        token.add_service(serviceRtm2);
        return token.build();
      }
    };
    module.exports.RtmTokenBuilder = RtmTokenBuilder;
  }
});

// node_modules/agora-token/src/SttTokenBuilder.js
var require_SttTokenBuilder = __commonJS({
  "node_modules/agora-token/src/SttTokenBuilder.js"(exports, module) {
    var AccessToken = require_AccessToken2().AccessToken2;
    var ServiceRtc = require_AccessToken2().ServiceRtc;
    var ServiceRtm = require_AccessToken2().ServiceRtm;
    var ServiceStt = require_AccessToken2().ServiceStt;
    var Role = require_RtcTokenBuilder2().Role;
    var SttTokenBuilder = class {
      /**
       * Builds an STT token with RTC and RTM services.
       * @param {*} appId The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} account The account used by both RTC and RTM, max length is 255 bytes.
       * @param {*} tokenExpire Represented by the number of seconds elapsed since now. Defaults to 86400. This
       * is the whole token expiration. The whole token is invalid after this time, even if a privilege
       * expiration time is later.
       * @param {*} privilegeExpire Represented by the number of seconds elapsed since now. Defaults to 0. This
       * value must not exceed tokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @return The STT token.
       */
      static buildToken(appId, appCertificate, channelName, account, tokenExpire = 86400, privilegeExpire = 0) {
        return this.buildTokenWithPrivilege(
          appId,
          appCertificate,
          channelName,
          account,
          Role.PUBLISHER,
          tokenExpire,
          privilegeExpire,
          privilegeExpire,
          privilegeExpire,
          privilegeExpire,
          account,
          privilegeExpire
        );
      }
      /**
       * Builds an STT token with RTC and RTM services.
       * @param {*} appId The App ID issued to you by Agora.
       * @param {*} appCertificate Certificate of the application that you registered in the Agora Dashboard.
       * @param {*} channelName The unique channel name for the Agora RTC session in string format. The string length must be less than 64 bytes. The channel name may contain the following characters:
       * - All lowercase English letters: a to z.
       * - All uppercase English letters: A to Z.
       * - All numeric characters: 0 to 9.
       * - The space character.
       * - "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ",".
       * @param {*} rtcAccount The RTC user's account, max length is 255 bytes.
       * @param {*} rtcRole Role.PUBLISHER for a broadcaster or Role.SUBSCRIBER for an audience member.
       * @param {*} rtcTokenExpire Represented by the number of seconds elapsed since now. This is the whole
       * token expiration. The whole token is invalid after this time, even if a privilege expiration time is
       * later.
       * @param {*} joinChannelPrivilegeExpire Represented by the number of seconds elapsed since now. This
       * value must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} pubAudioPrivilegeExpire Represented by the number of seconds elapsed since now. This value
       * must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} pubVideoPrivilegeExpire Represented by the number of seconds elapsed since now. This value
       * must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} pubDataStreamPrivilegeExpire Represented by the number of seconds elapsed since now. This
       * value must not exceed rtcTokenExpire; otherwise, the privilege is limited by the token expiration time.
       * @param {*} rtmUserId The RTM user's account, max length is 255 bytes.
       * @param {*} rtmTokenExpire Represented by the number of seconds elapsed since now. This value must not
       * exceed rtcTokenExpire; otherwise, the RTM login privilege is limited by the token expiration time.
       * @return The STT token.
       */
      static buildTokenWithPrivilege(appId, appCertificate, channelName, rtcAccount, rtcRole, rtcTokenExpire, joinChannelPrivilegeExpire, pubAudioPrivilegeExpire, pubVideoPrivilegeExpire, pubDataStreamPrivilegeExpire, rtmUserId, rtmTokenExpire) {
        const token = new AccessToken(appId, appCertificate, 0, rtcTokenExpire);
        const serviceRtc = new ServiceRtc(channelName, rtcAccount);
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, joinChannelPrivilegeExpire);
        if (rtcRole === Role.PUBLISHER) {
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, pubAudioPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, pubVideoPrivilegeExpire);
          serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, pubDataStreamPrivilegeExpire);
        }
        token.add_service(serviceRtc);
        const serviceRtm = new ServiceRtm(rtmUserId);
        serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, rtmTokenExpire);
        token.add_service(serviceRtm);
        token.add_service(new ServiceStt());
        return token.build();
      }
    };
    module.exports = {
      SttTokenBuilder
    };
  }
});

// node_modules/agora-token/index.js
var require_agora_token = __commonJS({
  "node_modules/agora-token/index.js"(exports, module) {
    module.exports = {
      ApaasTokenBuilder: require_ApaasTokenBuilder().ApaasTokenBuilder,
      ChatTokenBuilder: require_ChatTokenBuilder().ChatTokenBuilder,
      ConvoAITokenBuilder: require_ConvoAITokenBuilder().ConvoAITokenBuilder,
      EducationTokenBuilder: require_EducationTokenBuilder().EducationTokenBuilder,
      FpaTokenBuilder: require_FpaTokenBuilder().FpaTokenBuilder,
      RtcRole: require_RtcTokenBuilder2().Role,
      RtcTokenBuilder: require_RtcTokenBuilder2().RtcTokenBuilder,
      RtmTokenBuilder: require_RtmTokenBuilder2().RtmTokenBuilder,
      Rtm2Permissions: require_AccessToken2().Rtm2Permissions,
      SttTokenBuilder: require_SttTokenBuilder().SttTokenBuilder
    };
  }
});

// index.js
var import_agora_token = __toESM(require_agora_token(), 1);
var PROJECT = "yaqin-3f9f9";
var APP_ID = "868b06d16f0f43dc82dec0f4fefb23e9";
var FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
var ORIGINS = [
  "https://yaqin-3f9f9.web.app",
  "https://yaqin-3f9f9.firebaseapp.com",
  "http://localhost:5000",
  "http://localhost:8080"
];
function isAllowedOrigin(origin) {
  if (ORIGINS.includes(origin)) return true;
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.origin === origin;
  } catch {
    return false;
  }
}
var index_default = {
  async fetch(req, env) {
    const reqOrigin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": isAllowedOrigin(reqOrigin) ? reqOrigin : ORIGINS[0],
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Content-Type": "application/json"
    };
    const out = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: cors });
    const fail = (error, status) => out({ error }, status);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (new URL(req.url).pathname === "/api/openinary/sign") {
      if (req.method !== "POST") return fail("Method not allowed", 405);
      if (!isAllowedOrigin(reqOrigin)) return fail("Bu saytga ruxsat berilmagan.", 403);
      if (!env.OPENINARY_API_KEY) return fail("OPENINARY_API_KEY Worker Secret sifatida sozlanmagan.", 500);
      const idToken2 = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!idToken2) return fail("Avval Yaqin hisobingizga kiring.", 401);
      let body2;
      try {
        body2 = await req.json();
      } catch {
        return fail("Noto\u02BBg\u02BBri so\u02BBrov.", 400);
      }
      if (!body2 || typeof body2 !== "object" || Array.isArray(body2)) return fail("Noto\u02BBg\u02BBri so\u02BBrov.", 400);
      let uid2;
      try {
        uid2 = jwtUid(idToken2);
      } catch {
        return fail("Token noto\u02BBg\u02BBri.", 401);
      }
      if (!uid2 || typeof uid2 !== "string") return fail("Token noto\u02BBg\u02BBri.", 401);
      const userCheck = await fetch(`${FS}/users/${encodeURIComponent(uid2)}`, {
        headers: { Authorization: "Bearer " + idToken2, "User-Agent": "Yaqin-Openinary-Worker/1.0" }
      });
      if (userCheck.status === 401 || userCheck.status === 403) return fail("Sessiya yaroqsiz. Qayta kiring.", 401);
      if (!userCheck.ok) return fail("Foydalanuvchi hisobini tekshirib bo\u02BBlmadi.", userCheck.status === 404 ? 403 : 502);
      const scope = String(body2.scope || "");
      let folder;
      if (scope === "profile" || scope === "ads" || scope === "private") {
        folder = `yaqin/users/${uid2}/${scope}`;
      } else if (scope === "group") {
        const gid2 = String(body2.groupId || "");
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(gid2)) return fail("Guruh ID noto\u02BBg\u02BBri.", 400);
        const g2 = await fetch(`${FS}/groups/${encodeURIComponent(gid2)}`, {
          headers: { Authorization: "Bearer " + idToken2, "User-Agent": "Yaqin-Openinary-Worker/1.0" }
        });
        if (g2.status === 401 || g2.status === 403) return fail("Guruhni tekshirish uchun ruxsat yo\u02BBq.", 403);
        if (g2.status === 404) return fail("Guruh topilmadi.", 404);
        if (!g2.ok) return fail("Guruhni tekshirib bo\u02BBlmadi.", 502);
        const member = await fetch(`${FS}/groups/${encodeURIComponent(gid2)}/members/${encodeURIComponent(uid2)}`, {
          headers: { Authorization: "Bearer " + idToken2, "User-Agent": "Yaqin-Openinary-Worker/1.0" }
        });
        if (member.status === 404 || member.status === 403) return fail("Faqat guruh a\u02BCzolari media yuklay oladi.", 403);
        if (!member.ok) return fail("Guruh a\u02BCzoligini tekshirib bo\u02BBlmadi.", 502);
        const group = (await g2.json()).fields || {};
        const owner = group.owner?.stringValue || "";
        const mediaMode = group.mediaUploadMode?.stringValue || "owner";
        if (owner !== uid2 && mediaMode !== "members") return fail("Guruh egasi media yuklashga ruxsat bermagan.", 403);
        folder = `yaqin/groups/${gid2}/${uid2}`;
      } else {
        return fail("Yuklash turi noto\u02BBg\u02BBri.", 400);
      }
      let signed;
      try {
        const sr = await fetch("https://cdn.openinary.dev/upload/sign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + env.OPENINARY_API_KEY,
            "User-Agent": "Yaqin-Openinary-Worker/1.0"
          },
          body: JSON.stringify({ expiresIn: 300, folder })
        });
        let sd = {};
        try {
          sd = await sr.json();
        } catch {
        }
        if (!sr.ok || !sd.success || !sd.signature || !sd.expires || !sd.folder) {
          return fail(sd.error || "Openinary imzo bera olmadi.", sr.ok ? 502 : sr.status);
        }
        signed = { signature: sd.signature, expires: sd.expires, folder: sd.folder };
      } catch {
        return fail("Openinary xizmatiga ulanib bo\u02BBlmadi.", 502);
      }
      return out(signed);
    }
    if (req.method !== "POST") return fail("Method not allowed", 405);
    if (!env.AGORA_APP_CERT) return fail("AGORA_APP_CERT server siri sozlanmagan.", 500);
    const idToken = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!idToken) return fail("Avval Yaqin hisobingizga kiring.", 401);
    let body;
    try {
      body = await req.json();
    } catch {
      return fail("Noto\u02BBg\u02BBri so\u02BBrov.", 400);
    }
    const channel = String(body.channel || "");
    const uid = Number(body.uid);
    if (!/^yq_[A-Za-z0-9_-]{1,60}$/.test(channel) || !Number.isSafeInteger(uid) || uid < 1 || uid > 4294967295)
      return fail("Kanal yoki foydalanuvchi ID noto\u02BBg\u02BBri.", 400);
    const gid = channel.slice(3);
    const h = { Authorization: "Bearer " + idToken };
    const g = await fetch(`${FS}/groups/${encodeURIComponent(gid)}`, { headers: h });
    if (g.status === 401 || g.status === 403) return fail("Sessiya yaroqsiz. Qayta kiring.", 401);
    if (g.status === 404) return fail("Guruh topilmadi.", 404);
    if (!g.ok) return fail("Guruhni tekshirib bo\u02BBlmadi.", 502);
    let fbUid;
    try {
      fbUid = jwtUid(idToken);
    } catch {
      return fail("Token noto\u02BBg\u02BBri.", 401);
    }
    if (!fbUid) return fail("Token noto\u02BBg\u02BBri.", 401);
    if (uid !== hashUid(fbUid)) return fail("Foydalanuvchi ID mos kelmadi.", 403);
    const m = await fetch(`${FS}/groups/${encodeURIComponent(gid)}/members/${encodeURIComponent(fbUid)}`, { headers: h });
    if (m.status === 404 || m.status === 403) return fail("Faqat guruh a\u02BCzolari qo\u02BBng\u02BBiroqqa kira oladi.", 403);
    if (!m.ok) return fail("A\u02BCzolikni tekshirib bo\u02BBlmadi.", 502);
    const f = (await g.json()).fields || {};
    const pu = f.premiumUntil || {};
    const premiumUntil = Number(pu.integerValue ?? pu.doubleValue ?? 0);
    if (!(premiumUntil > Date.now())) return fail("Guruh Premium muddati tugagan.", 403);
    const expire = Math.floor(Date.now() / 1e3) + 3600;
    const token = import_agora_token.RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      env.AGORA_APP_CERT,
      channel,
      uid,
      import_agora_token.RtcRole.PUBLISHER,
      expire,
      expire
    );
    return out({ appId: APP_ID, channel, uid, token, expiresAt: expire });
  }
};
function jwtUid(t) {
  const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = JSON.parse(atob(p + "=".repeat((4 - p.length % 4) % 4)));
  return json.user_id || json.sub;
}
function hashUid(v) {
  let h = 2166136261;
  for (let i = 0; i < v.length; i++) {
    h ^= v.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}
export {
  index_default as default
};
