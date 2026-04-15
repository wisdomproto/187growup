// Atlas 이미지 전처리: docs/reference-book/atlas-*/_photo.png 54장을
// public/atlas/{male,female}/*.webp 로 crop + resize + webp 저장하고
// public/atlas.json 메타데이터 생성.
//
// 실행: node scripts/prepare-atlas.mjs (webapp/ 디렉토리에서)

import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_MALE = path.resolve(ROOT, "..", "docs", "reference-book", "atlas-male");
const SRC_FEMALE = path.resolve(ROOT, "..", "docs", "reference-book", "atlas-female");
const DEST = path.resolve(ROOT, "public", "atlas");

// 책 페이지(1653×2339)에서 X-ray 본체만 crop하는 박스
// 관찰값: 상단 제목바 ~170px, 좌측 여백 ~155px, 우측 사이드바 ~175px, 하단 라벨 ~240px
const CROP = {
  left: 155,
  top: 170,
  width: 1653 - 155 - 175,   // 1323
  height: 2339 - 170 - 240,  // 1929
};

const RESIZE_WIDTH = 800;  // 비율 유지 → 높이 ≈ 1166

// atlas-male/F_01-7_photo.png 파일명 파싱
function parseFilename(name) {
  // M_01-5_photo.png / F_13-8a_photo.png
  const m = name.match(/^([MF])_(\d{2})-(\d)([a-z]?)_photo\.png$/);
  if (!m) return null;
  const [, gender, whole, frac, suffix] = m;
  return {
    gender,
    age: parseFloat(`${parseInt(whole, 10)}.${frac}`),
    suffix,
    stem: `${gender}_${whole}-${frac}${suffix}`,
  };
}

async function processDir(srcDir, subName) {
  const dest = path.join(DEST, subName);
  if (!existsSync(dest)) await mkdir(dest, { recursive: true });

  const files = (await readdir(srcDir)).filter((f) => f.endsWith("_photo.png")).sort();
  const entries = [];

  for (const file of files) {
    const meta = parseFilename(file);
    if (!meta) {
      console.warn(`  skip (unrecognized): ${file}`);
      continue;
    }
    const srcPath = path.join(srcDir, file);
    const outFile = `${meta.stem}.webp`;
    const outPath = path.join(dest, outFile);

    await sharp(srcPath)
      .extract(CROP)
      .resize({ width: RESIZE_WIDTH })
      .webp({ quality: 85 })
      .toFile(outPath);

    entries.push({
      gender: meta.gender,
      age: meta.age,
      suffix: meta.suffix || null,
      file: `${subName}/${outFile}`,
    });
  }

  return entries;
}

async function main() {
  console.log("Preparing atlas images...");
  if (!existsSync(DEST)) await mkdir(DEST, { recursive: true });

  const male = await processDir(SRC_MALE, "male");
  console.log(`  male:   ${male.length} images`);
  const female = await processDir(SRC_FEMALE, "female");
  console.log(`  female: ${female.length} images`);

  const all = [...male, ...female].sort(
    (a, b) => (a.gender === b.gender ? a.age - b.age : a.gender.localeCompare(b.gender))
  );

  const jsonPath = path.resolve(ROOT, "public", "atlas.json");
  await writeFile(jsonPath, JSON.stringify({ entries: all }, null, 2), "utf8");
  console.log(`  atlas.json: ${all.length} total entries`);

  // 간단 sanity check
  const malePng = await sharp(path.join(DEST, "male", "M_01-5.webp")).metadata();
  console.log(`  sample size: ${malePng.width}×${malePng.height}`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
