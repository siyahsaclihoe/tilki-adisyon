// ============================================================================
// TILKIADISYON AES-256-GCM ENCRYPTED MODULE (TAMPER-GUARD) - DO NOT MODIFY
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
const __IV = Buffer.from("aaaae8aba59481cd7e4e7150a6e4f70f", "hex");
const __TAG = Buffer.from("576f662453c30efd9c95402c1b38e847", "hex");
const __DAT = Buffer.from("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", "base64");
const __DEC = crypto.createDecipheriv("aes-256-gcm", __K, __IV);
__DEC.setAuthTag(__TAG);
const __SRC = zlib.brotliDecompressSync(Buffer.concat([__DEC.update(__DAT), __DEC.final()])).toString("utf8");
const __FN = new Function("crypto","zlib","fs","path","readline","os","execSync","spawnSync","spawn","fileURLToPath","importMetaUrl", __SRC);
__FN(crypto, zlib, fs, path, readline, os, execSync, spawnSync, spawn, fileURLToPath, import.meta.url);