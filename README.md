# VT — Visual Translation

Visual Translation 과목 작업 기록 저장소.
기획의도에 따라 사진을 촬영하고, 그래픽 작업을 거쳐 **앨범커버**를 완성하는 과정을 기록·관리한다.

## 폴더 구조

| 폴더 | 내용 |
| --- | --- |
| [`01_concept/`](01_concept/) | 기획의도, 콘셉트, 키워드, 무드 정리 |
| [`02_references/`](02_references/) | 레퍼런스 이미지, 무드보드 |
| [`03_photos/raw/`](03_photos/raw/) | 촬영 원본 (RAW 파일은 용량 문제로 Git에서 제외됨) |
| [`03_photos/selected/`](03_photos/selected/) | 셀렉한 컷 (JPG/PNG) |
| [`04_graphics/`](04_graphics/) | 그래픽 작업 파일 (PSD, AI 등) 및 중간 시안 |
| [`05_final/`](05_final/) | 최종 앨범커버 결과물 |
| [`log/`](log/) | 날짜별 작업일지 (`TEMPLATE.md` 복사해서 사용) |

## 작업 흐름

1. **기획** — `01_concept/concept.md`에 기획의도 작성
2. **리서치** — 레퍼런스를 `02_references/`에 모으기
3. **촬영** — 원본은 `03_photos/raw/`, 고른 컷은 `03_photos/selected/`
4. **그래픽** — 작업 파일과 시안을 `04_graphics/`에 버전별로 저장 (`v01`, `v02` …)
5. **완성** — 최종본을 `05_final/`에 저장
6. 작업한 날마다 `log/`에 작업일지를 남기고 커밋

## 기록 남기기 (Git)

```bash
git add .
git commit -m "촬영 셀렉 컷 추가"
git push
```

## 파일 이름 규칙 (권장)

- 날짜 + 내용 + 버전: `2026-10-08_cover_v01.psd`
- 공백 대신 `_` 또는 `-` 사용

## 참고

- GitHub는 **100MB를 넘는 파일**을 올릴 수 없다. 큰 PSD는 레이어를 정리하거나 Git LFS를 사용한다.
- RAW 원본(`.CR2`, `.CR3`, `.NEF`, `.ARW`, `.DNG` 등)은 `.gitignore`로 제외되어 있으니 외장하드/클라우드에 따로 백업한다.
