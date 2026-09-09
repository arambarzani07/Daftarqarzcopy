# دەفتەری قەرز — iPhone و Android

کۆپییەکی کاراکەی ڕووکار و ڕەفتاری ئەپی ناو ڤیدیۆی سەرچاوە، بە زمانی کوردی و ئاراستەی RTL.

## تایبەتمەندییە کاراکان

- لیستی قەرزدار و کۆی قەرز
- گەڕان بە ناوی کوردی یان لاتینی
- زیادکردنی قەرزدار
- پەڕەی وردەکاری هەر قەرزدارێک
- تۆمارکردنی قەرز و گەڕاندنەوەی پارە
- هەژمارکردنی کۆی مامەڵەکان
- هەڵگرتنی داتا لەسەر ئامێر و کارکردن بەبێ ئینتەرنێت
- فلتەری بەروار و بڕی پارە
- مینیوی ڕێکخستن، ڕووکارێکی تاریک/ڕوون و PIN
- پڕۆژەی Native بۆ Android و iOS بە Capacitor

## بەکارهێنان

```bash
npm install
npm run dev
```

## بێلد

```bash
npm run build
npm run cap:sync
```

پڕۆژەی Android لە `android/` و پڕۆژەی iPhone لە `ios/` دایە.

## IPAی ناواژۆکراو

Workflowی `.github/workflows/build-unsigned-ipa.yml` لە GitHub Actions بە macOS
ئەپەکە compile دەکات و `daftari-qarz-unsigned.ipa` وەک artifact دەداتەوە.
IPAکە واژۆی Apple Developerی نییە و بۆ دامەزراندن دەبێت بە AltStore یان
Sideloadly و Apple IDی بەکارهێنەر واژۆ بکرێت.
