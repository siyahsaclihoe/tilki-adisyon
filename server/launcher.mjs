// ============================================================================
// TILKIADISYON AES-256-GCM ENCRYPTED MODULE (LAUNCHER) - DO NOT MODIFY
// Developers: doga.dev & ensxr.dev
// ============================================================================
import crypto from "node:crypto";
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import os from "node:os";
import { execSync, spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const __K = crypto.createHash("sha256").update("TILKIADISYON-DOGA-ENSXR-SECRET-KEY-2026").digest();
const __IV = Buffer.from("02a0cef2baa1f90104cf22fb56d9f28b", "hex");
const __TAG = Buffer.from("a7ec681fcb6b9b0d9a696e09b36f4c48", "hex");
const __DAT = Buffer.from("UEgaedoex89fXGlgzxoym7ZvRZG051vg6wdcSK5KhDpPuDe8qkyApzu9PLSJQsCixWZYRgLMpzf0ydfaYqK+0lc0bsRmk62T2taK/SkzTVIegKida850YGb/EWZXpjjb1599jILvShuHDAsTYDOvyUWleq1nlRSetFsqp7TQ9KklOSBXZF90Jewh2LTRhJEjqpkmOug9JdZ2HvLEiv6WBRI3U7Ta9xR4LDewrRam6xM7KR0u8QpOTQjLFOV8t/90VKiJAggSa7Nl30UICvz2HYgeMZeGNvdQgFKAx419q8xPEGdwPGaezIqid62YX4/CRG/L56c8OrmHKPKDqLFFplOJeoyFXELVPDTDVsBAY6HKqntLjCKUMuKgu+IwCe9OnPx8lQy2uohMtUcDoTunceBqlZMRhpIOskLZGCStb7CWJGa/KsrJ+SRwNCcpw0kiFKOAG49tjNJujixGEfMx7WnFaRpUI2a8DLoFrmNkjn/XqNAtZ+gE7i4OzSCLtmGEAPAUgjFU9kR/0kUYxaLODl6db9eDuDAMF0qXyLoyec/XVJ7UlQuH7I7RRuCd6Yuf3Di0xCl5nG+S80fJj9qOjbYMI00pr0DRNlRTUHFLUCFvN9tMCPuy7aTNliHXlLbJe8TwJfZPshTTpk/OQx7bDwgFQ0iB/DWX0wKkUkY9Xjp6DoiFC2IGct9j3IRpPR/aRuHLvxUgWA9zbWF4Yfr4iPNkRrzYQzoej30Jb3t6ay0a5a2uPYHFGcnvtYpGQYKcRbp4vlhT1zrwImNlm9RAgXWshxw4Qtui16tYi//8EodNPJF76K7G/TzByFzWkpXTlH9xtuPxprW/d+l+71fZjfqGsgkgUNxF267uvHOnHJ1UfZKQhHhR3DkvVkXmCAUAwpZYgapvIaSGUkSMzUKyV4Q6sJCLxI5dQXxYdMn1Ab18hnHsJ2z8jz0DsvVWlz3OlF09po3FGqwFt89A2BJp/2JacX1AF6Y/DfHB3+0YBD4spkoZ3SsObQN/ZTtDqOy0zQdKCMODqpqF+/NI0ztaHZyQb7qSMsuJlnYsIFsmsGl8fneqalsGKbWXXWAYwg==", "base64");
const __DEC = crypto.createDecipheriv("aes-256-gcm", __K, __IV);
__DEC.setAuthTag(__TAG);
const __SRC = zlib.brotliDecompressSync(Buffer.concat([__DEC.update(__DAT), __DEC.final()])).toString("utf8");
const __FN = new Function("crypto","zlib","fs","path","readline","os","execSync","spawnSync","spawn","fileURLToPath","importMetaUrl", __SRC);
__FN(crypto, zlib, fs, path, readline, os, execSync, spawnSync, spawn, fileURLToPath, import.meta.url);