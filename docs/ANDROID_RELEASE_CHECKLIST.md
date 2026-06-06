# Android Release Checklist

This document tracks the required work before publishing the Android app to Google Play.

## Current Target

- Platform: Android
- Store: Google Play
- App type: Reader app with cloud-managed book content
- Backend: Vercel + Vercel Blob
- Package source: `android/`

## 1. Product And App Readiness

- [ ] Confirm final app name.
- [ ] Confirm final Android package name.
- [ ] Remove or hide any admin-only entry from the user-facing Android app.
- [x] Add an About/Settings screen.
- [x] Show app version in the app.
- [x] Add Privacy Policy entry in the app.
- [ ] Confirm production API domain, not temporary Vercel domain.
- [ ] Confirm cloud book update flow works after app reinstall.
- [ ] Confirm offline/fallback message behavior is acceptable.

## 2. Privacy And Compliance

- [x] Create public Privacy Policy page.
- [ ] Add Privacy Policy URL to Google Play Console.
- [ ] Document what data the app collects.
- [ ] Confirm reading progress is stored locally only.
- [ ] Confirm admin login is not exposed to normal users.
- [ ] Prepare Google Play Data Safety answers.
- [ ] Prepare age rating questionnaire answers.
- [ ] Add support email.

## 3. Branding And Store Assets

- [ ] Create production app icon.
- [ ] Create Android adaptive icon.
- [ ] Create splash screen asset.
- [ ] Prepare feature graphic.
- [ ] Prepare phone screenshots.
- [ ] Write short description.
- [ ] Write full description.
- [ ] Choose app category.
- [ ] Choose content rating.

## 4. Android Release Build

- [ ] Create production signing key.
- [ ] Store signing key safely.
- [ ] Configure release signing.
- [ ] Set `versionName`.
- [ ] Set `versionCode`.
- [ ] Build Android App Bundle (`.aab`) for Google Play.
- [ ] Verify release build installs and opens on real Android device.
- [ ] Verify release build reads books from production API.
- [ ] Verify release build does not require local development server.

## 5. Testing Before Submission

- [ ] Test first launch.
- [ ] Test book list loading.
- [ ] Test cloud book update after adding a book in admin.
- [ ] Test reading progress persistence after app restart.
- [ ] Test tap page turn.
- [ ] Test swipe page turn.
- [ ] Test last page completion state.
- [ ] Test weak network.
- [ ] Test offline mode.
- [ ] Test empty book list state.
- [ ] Test long title and long content.
- [ ] Test at least one small-screen Android device.
- [ ] Test at least one large-screen Android device or emulator.

## 6. Google Play Console

- [ ] Create Google Play app.
- [ ] Fill app details.
- [ ] Upload app bundle.
- [ ] Fill Data Safety.
- [ ] Fill content rating.
- [ ] Add Privacy Policy URL.
- [ ] Add screenshots and graphics.
- [ ] Set countries/regions.
- [ ] Configure testing track.
- [ ] Run internal testing.
- [ ] Run closed testing if required by account.
- [ ] Fix issues found in testing.
- [ ] Submit production release.

## Suggested Order

1. Finish product-required in-app pages: About/Settings, Privacy Policy entry, version display.
2. Bind final production domain and update app API config.
3. Create Privacy Policy page.
4. Create app icon, splash, screenshots, and descriptions.
5. Configure release signing and build `.aab`.
6. Test the release build on real device.
7. Set up Google Play Console listing and testing track.
8. Submit for review.

## Notes

- Current APK builds are suitable for real-device testing, but Google Play normally expects an Android App Bundle (`.aab`).
- The release build must use production signing, not debug signing.
- Book updates should happen through the online admin page and Vercel Blob, not by rebuilding the app.
- If the Google Play developer account is new, closed testing may be required before production release.
