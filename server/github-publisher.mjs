// ============================================================================
// TILKIADISYON AES-256-GCM ENCRYPTED MODULE (GITHUB-PUBLISHER) - DO NOT MODIFY
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
const __IV = Buffer.from("5a00e09328fb988bdb75d56e3b1b3510", "hex");
const __TAG = Buffer.from("90da38c6a1b550c79f74856f1a8c97a9", "hex");
const __DAT = Buffer.from("qq1xVLG5ozd1cvECZs8cFv8vu9xzghSi2g0DGSrxTbKWm+QvQdWZVnFXNr/AEkPnLsLY6gDxhPNMDiTDyqmvfl6cuzdLLBj1n2yl70zVJNkRj90ac6diTQtYwd11Nx0UUMAKIXSDG2qifk5zn4Qjx2+LN+tbDoG1S7SbRiW8zzwRd2F6qnfXPvecXLMdwqII4JP/1s5sDXsnOoqa+jkN0Am+reQV9pohbGzSKT4DUZCGIpFQNsbu7blD0IAsSyToHmVh9P0u3X2ivRGfdhm4DH7hDOb2xtbLgXF6qY6lts07O2I2YxKVnwWxf2QuCG9llPlsn68sbW0KYDoZjvvgyCVu8hsb9WunT/y/HzMn9uBCJwiBiWagX1ZAK9Oz/c040U60gZ9wie/GEj2fGdyVuJWf6ynDWhQGtWZ7q2m37HGWm7dptZh24Cx2p4E6GzKh7OGp6WUgndxKpRFK6gRrJfJ7pUbloywm8lWLlAbtVAR5SoO7zbGV8E2t/z27r8LBAQL2rKrvE/RnmNd1tB+LX2mUFnB3D6ewtpgSeBk3NnRC4WkBKwjTr0XNlZ2jsej0saAwgGoFZCshbefkkKqG9w2dqzpAowd2Zzc+eSUdAZs1bj3xskxXAlym7OzQ2wRW6NRcoZiWB0BEPv9h49scNE/RBSvLuBXh6wkUYGqiTIhieHKOXE6uH1oKuzRHAp/fFOCgtZuK63cGhmvKQAZuJm8GPmha6gli225AITYbukIraJjhOzIhZF27gpVxpx5FcA5hDwAnSHFRvh9nlDI7gwAKCZhuql1OOi2HB03PHc7LszDBuzMW3qbw4fNHHYYqiyIio7UxzAHp8lJgx+AQexPzBCmBZHD2o40QFgyAGVNLNoE0lVNaLO6TI7ZqOBeQBuk3aEpqmP7gQZm/lJfkL55XgkEJgSHtjGfB/vDeY/5HnMyUPxCFDDI7XSiVGwH4via2aLTNAcMW+FaAWKdZ6ELPFoB04RFndSQ2o5sGw44JqQEPMUfgR6N+bFldVnygDxGzWiFbvKfK8gIQhw5BEGBcpRX/ciK5OsHqaYAIKty8tSNJqs8fvh3PFx2/Cx9MJSsku0GmSgXeZx92nZjoKrgIwIZ56JpnP6A34aQB56WFZDnuqmvRZyeWtB3crQA11oht7b9RxRa0zQ7Zk415jEmLxheFHggsqMAhKPw12gbKJt9clJkUXptpwkFA+S5LdAUj5AVb7ZcAmPGUeHchRdjutIS5BTGRtIbPYFarbOF2crkPfIeFlmQhmKeKvOupMMLGOAWMry/pMGnq7o+cVM0JlECln8ws+mfX/kuSf0XhYOhsuKEqqd1vReo5b1NO8dbNowmOb0FbN4S1Ranj3nmfPdqiNExYhRg/nn++ERzhK1UTsqjMPJM2xuFrtXaSQZd21uToCXPAH0hXe4Gv56x/UsXuGOvGy8+7hqzgEj/LSp4PSM/bbUasCU9BZ16gBK+N+s1n3Po7Tv9dxqooiWBe9C2m0IvOAGY2XwjQU0BjZ1fMU670vWi+Zv87Dy+Kb6aZVgGqg7Yh9RVr9BhSf2Ov89l7tTZlvSw7ZwyMepdhL1a+fmNFoPx9sHzx7e2ZorzZHxKVwuL5y+TwrPfYnK3x/zNv4hKPSgHxxw6zJos4FDixHtOCVF93nhFarpZBJ1lh8rUkJc0M/wJTf6ddgGpOrtWlJFg9VEl58/a3sKQOwgkp4Oy+zZ9d4q+GynWYxXx/gFS03d4fZG2ztZtu4hWOTw==", "base64");
const __DEC = crypto.createDecipheriv("aes-256-gcm", __K, __IV);
__DEC.setAuthTag(__TAG);
const __SRC = zlib.brotliDecompressSync(Buffer.concat([__DEC.update(__DAT), __DEC.final()])).toString("utf8");
const __FN = new Function("crypto","zlib","fs","path","readline","os","execSync","spawnSync","spawn","fileURLToPath","importMetaUrl", __SRC);
__FN(crypto, zlib, fs, path, readline, os, execSync, spawnSync, spawn, fileURLToPath, import.meta.url);