# Checkpoint: Mobile Production Regression Audit

Date: 2026-09-24 (Asia/Bangkok)  
Branch: `qa-mobile-audit`  
Author: Senior QA & Full-stack Engineer  
Reviewer: Codex  
Status: READY FOR REVIEW

## Summary

Completed an end-to-end mobile viewport regression audit and root-cause fix for the Sabuyship web application covering authentication, product link extraction, mobile bottom bar clearance, customer journey validation, and bundle performance.

## Verified Items

1. **Taobao Share Text & URL Input**:
   - Confirmed full text: `【淘宝】7天无理由退货 https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp CZ007 「*CSB挂脖背心露背舒适弹力瑜伽服美背Form Athena Tank」\n点击链接直接打开 或者 淘宝搜索直接打开`
   - Correctly extracted: `https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp`
   - Native browser popup blockage resolved by switching `<Input type="url">` to `<Input type="text" inputMode="url">`.
   - Added friendly Thai guidance toast and validation errors for inputs without URLs.
2. **Authentication & Session UX**:
   - Technical provider and issuer error codes translated to user-friendly Thai.
   - Remember Me state stored in `localStorage` for identifier restoration.
   - Session logout augmented with `router.refresh()` to invalidate Next.js client router cache.
3. **Mobile Layout Clearance**:
   - Root layout padding set to `pb-24 md:pb-0` to prevent bottom buttons/content from being obscured by the bottom navigation bar.
4. **Performance**:
   - `browser-image-compression` converted to dynamic import on slip submission in `PaymentSection.tsx`.

## Verification Results

| Check | Result | Details |
|---|---|---|
| `git diff --check` | PASS | 0 whitespace or formatting warnings |
| `npm run typecheck` | PASS | TypeScript check exited 0 |
| `npm run schema:check` | PASS | All 15 Supabase tables, RLS & buckets verified |
| `npm run business:check` | PASS | Operator name & PromptPay ready |
| `npm run build` | PASS | 54/54 static routes generated with webpack |
| `node scripts/qa-mobile-audit.mjs` | PASS | 6/6 test cases passed |
