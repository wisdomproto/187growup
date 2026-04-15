# BoneAgeAI — Atlas Matching Webapp

환자 X-ray와 가장 비슷한 레퍼런스 Atlas 이미지 2장을 자동으로 찾아 뼈나이를 추정하는 Next.js 웹앱.

## 작동 방식

원장님의 판독 루틴을 그대로 자동화:

1. **환자 정보 입력** — 성별(남/여), 실제 나이(chronological age), 나이 필터 범위(±1/2/3년)
2. **X-ray 업로드** — 드래그앤드롭. 이미지는 서버로 전송되지 않음
3. **ROI 수동 지정** — 환자 이미지 위에 두 사각형을 드래그
   - 🟦 손등 박스 (wrist/carpal area — 정보 밀집)
   - 🟧 손가락 박스 (phalanges)
4. **자동 매칭** — SSIM + NCC 가중합으로 유사도 계산 → 환자보다 어린/많은 Atlas 중 최고점 1장씩
5. **3분할 결과** — `younger | patient | older` + 보간된 추정 뼈나이

## 데이터

`public/atlas/` 의 Atlas 이미지 54장 (남아 28 + 여아 26) — 『소아의 골연령 판정』 표준 필름.
재준비: `node scripts/prepare-atlas.mjs` (원본은 `../docs/reference-book/atlas-*/`).

## 기술

- **Next.js 16** (App Router) + TypeScript + TailwindCSS v4
- **클라이언트 사이드** 이미지 처리 (Canvas API) — 환자 데이터 프라이버시 보장
- 매칭 알고리즘: `lib/similarity.ts` (SSIM + Normalized Cross-Correlation)
- 배포: **Vercel** (정적 호스팅으로도 충분)

## 개발

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm build         # 프로덕션 빌드
node scripts/prepare-atlas.mjs  # Atlas 이미지 재생성
```

## 스코프

**MVP 포함**
- 수동 ROI 2개 (손등 / 손가락)
- SSIM + NCC 가중 매칭
- 상위 후보 8개 공개

**후속 확장 예정**
- ROI 자동 검출 (YOLO 등)
- Atlas 이미지별 사전 ROI 라벨링
- 딥러닝 임베딩 기반 매칭 (ResNet/DINO)
- PDF 리포트 저장, 케이스 히스토리

## 검증 케이스

`남자 13.2세.png` 샘플(atlas 원본)을 업로드 + 실제 나이 13 입력 + ROI 지정 시:
- younger: 남자 12.3세 (SSIM 0.54)
- older: 남자 13.2세 (SSIM 0.59)
- 추정: 12.77세
