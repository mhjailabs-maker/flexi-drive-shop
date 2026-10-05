# Flexi Drive Shop (৩টি ফাইলের প্রজেক্ট)

- `index.html`: পুরো সাইট (ডিজাইন, অফার, সেটিংস সব এক ফাইলে)
- `api/order.js`: অর্ডার সার্ভার (অর্ডার টেলিগ্রামে পাঠায়)
- `og-image.png`, `robots.txt`: ফেসবুক শেয়ারের ছবি ও সার্চ ফাইল

## GitHub → Vercel (৫ ধাপ)
1. ZIP খুলে ভেতরের সব ফাইল ও `api` ফোল্ডার GitHub রেপোর **একদম উপরের স্তরে** আপলোড করুন।
2. Vercel → Add New → Project → রেপো ইমপোর্ট (Framework: **Other**, কিছু বদলাবেন না) → Deploy।
3. Vercel → Settings → Environment Variables-এ বসান: `TELEGRAM_BOT_TOKEN` = BotFather-এর টোকেন (চ্যাট আইডি ফাইলে ডিফল্ট দেওয়া আছে)।
4. **Deployments → সর্বশেষটির ⋯ → Redeploy**। (ভ্যারিয়েবল বসানোর পর Redeploy না করলে কাজ করে না।)
5. বটকে টেলিগ্রামে `/start` দিন। সাইটের লিংকের শেষে `?debug=1` দিয়ে খুলুন। সব ✅ হলে একটি টেস্ট অর্ডার দিন।

## নিজে বদলানোর জায়গা (`index.html`)
- **সেটিংস ব্লক** (`FLEXI_CONFIG`): বিকাশ/নগদ নম্বর, সাপোর্ট লিংক, Pixel ID।
- **অফারের তালিকা** (`FLEXI_OFFERS`): `r` = রেগুলার দাম, `p` = আপনার বিক্রয়মূল্য।
- `YOUR-DOMAIN`: ফাইলের উপরে og:image লাইনে নিজের ডোমেইন বসান।

## বিজ্ঞাপনের আগে
আসল দাম বসান, Meta Pixel ID বসান, পুরনো টোকেন `/revoke` করে নতুনটা শুধু Vercel-এ বসান।
