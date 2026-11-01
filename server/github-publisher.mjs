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
const __TAG = Buffer.from("c32c664bd7471961b8d4689ecb0735dd", "hex");
const __DAT = Buffer.from("qjl2VIE0Di/7yB9SG5j0KSUN3eGTKahxvxr4j05i4xIiuyo1hg3LXmR288XICUdRimQw8AcHnDPE492746lhvPfF/3U1o/9EuSmtV9FMw0jBUW1/rJqsR6DgeGLbKrTKR3Gd9U4H5slD7vMHS3975PH536Toysyb7DhzjIGQrmyNJyAPq5Xc8GDRtrAvmhr3pWzeA8HFppX1kZAsyPtuIzeNTj3a8LHjt2zjRiOJagsbC6qqVPGnkPJ0dUTW6OJks2OTXhobGbKrpBOj7+gfQFVZi/9WvWUN2s7HVDlmHbauIOWAGUfcYZT8FqyWaiQbeYh73g/xpVb2k2YIflFrYbe3jXokJk8jl6Elf2W7g9m4pvxFY6iBXtCvfq+cGQu9q714Sn2nQmp7tjkVaM6Od5a8Hg2Jh+EOIvzJGmdfKjT77wzyeJph59kfUGy34xYrCVjVWUI1Yf6kbVDPUgkWS65lFdLEK9v1NZD1TR72yd/zAMVsMAFOuVz/+kE9BM/rUbq5PT/mHzi3t+1eNT116oIDyK5GGPxbKrt8BgX39mbhSylBfkUUtxM8RwPd7/mXbs5jW0MVBgtPb5XC0thOq7Sv3Kq3dcEEJn5GseQ7IoqYcywaru4HoY7gMUdU0XG3Lp6zS5GpS4TNzmJH4SzfDR4DST/GqvTMR3AvuSSoI1VlbMWYkeO4C3BgsYm0bn40R7ewais9HU4hZCS5wJkWWJCZspqGYgs0gsmnFp3GOQ+P6O+32DOfwQHQiqiSnTEr0Smsmugr1ADEaSccvODi58mgIGEvtwMQWNpivddL5POwRSFRT6ekEFycgWca3n6jA+vf9Yr+C5rxQ4uQBN/ftEOsw4WvDj+52xI0uGkb0I+0x9VyzMTALcp47WOdTS7hmcgebK4IJ5QFxs2QPDS7cZBBhV6STesRR2SHovcnt4U8+r+mel2P2PS/ph12bAkIv9wwL5MnQ6MGDS53I43AxmePe48HexqWgtewLxwyeXauaa3XnQ21dNZZNcp5dSoUMz2iyxpsUkt51TZQLJCKcOLW2VCO0TaNeT3UlqYeOLFolB/dCHoIj98PQFtK5j0fGBlSwg82NPMcJGNX0NdXREg7TSgtm+vnDfvkY7KJYZMUX1OAz68bHCFb3VdJnfnzfvxC6BlX0DVo7UHSmBLRx73CKAaYmMkbEgK77VM0mz5WTz7IQkFZ1Dg3Pd5r8y4WZkEh/GmwjsP8Qg0k7C+25wzuNT8f2Ngt5CBSOko/z/w9mES5kutr+oFdYiWKQ9Dly5CCTiQcNGCWCc56ntQKbWH1kruWqcm57kLoPmmJ4go8SbxmaM88ROyQAeu0f9qamQTbLjeJuecJ5GIn3RZVCTP7HbjDPTO6XcL7AY/26fvcE1bjtMzzoJultTk/dpmCdbD/xiWOq9j9dv8lUp3x2ZGC97qXEir14DIMzk0riuu66kEeyEI4puM4oPn7mCWtUkZP/KfBUl7fFqyAR8w9vuRuO8a3lSy29LJJvOKCgq0Sex9eu6R4DXLEAmoozi346Pgl4y3vIXJ0RPbZ7W3QlRj1+fqI3cLLQZp+9zCdV0T5yDICfcai6TP2e8Iwaohgrbuu0K1GPW0TTfcjiTa3acgs9vvxXjHSS5+i+kDNf/knj9/SWA==", "base64");
const __DEC = crypto.createDecipheriv("aes-256-gcm", __K, __IV);
__DEC.setAuthTag(__TAG);
const __SRC = zlib.brotliDecompressSync(Buffer.concat([__DEC.update(__DAT), __DEC.final()])).toString("utf8");
const __FN = new Function("crypto","zlib","fs","path","readline","os","execSync","spawnSync","spawn","fileURLToPath","importMetaUrl", __SRC);
__FN(crypto, zlib, fs, path, readline, os, execSync, spawnSync, spawn, fileURLToPath, import.meta.url);