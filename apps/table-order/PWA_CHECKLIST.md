### PWA 배포 체크리스트

**로컬 환경:**
- [x] manifest.json 경로 확인
- [x] 아이콘 파일 모두 업로드 (icon-192x192.png, icon-512x512.png, apple-touch-icon.png)
- [x] Service Worker 정상 작동 확인
- [x] URL 바 제거 확인 (standalone 모드)

**프로덕션 배포 시:**
- [ ] HTTPS 인증서 적용 (필수!)
- [ ] 도메인 연결 확인
- [ ] Lighthouse PWA 점수 90+ 확인
- [ ] Android/iOS 태블릿에서 실제 테스트
- [ ] QR 코드 생성 및 테이블 배치
