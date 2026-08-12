# 2LS Bazar — Vercel + Firebase দিয়ে হোস্ট করার ধাপ

## ধাপ ১: Firebase প্রজেক্ট বানাও (ফ্রি — সব কাস্টমারের জন্য একই প্রোডাক্ট দেখাতে)
1. [console.firebase.google.com](https://console.firebase.google.com) এ যাও, Google অ্যাকাউন্ট দিয়ে লগইন করো
2. "Add project" ক্লিক করো, নাম দাও (যেমন: `2ls-bazar`), বাকি ধাপগুলো ডিফল্ট রেখে "Create project"
3. বাম পাশের মেনু থেকে "Build" → "Firestore Database" এ যাও
4. "Create database" ক্লিক করো → "Start in **test mode**" সিলেক্ট করো → পছন্দমতো লোকেশন দিয়ে "Enable"
   *(test mode মানে শুরুতে সবাই পড়তে/লিখতে পারবে — শুরুর জন্য ঠিক আছে, পরে চাইলে নিরাপত্তা নিয়ম শক্ত করা যায়)*
5. এবার প্রজেক্ট সেটিংসে যাও (⚙️ আইকন → "Project settings")
6. নিচের দিকে "Your apps" সেকশনে `</>` (Web) আইকনে ক্লিক করো, একটা নিকনেম দাও (যেমন: `web`), "Register app"
7. এখন একটা কোড দেখাবে যেখানে `firebaseConfig = {...}` আছে — এই ৬টা মান (apiKey, authDomain ইত্যাদি) কপি করো

## ধাপ ২: কনফিগ বসাও
এই প্রজেক্টের `src/firebaseConfig.js` ফাইল খুলে, `REPLACE_ME` জায়গাগুলোতে Firebase থেকে পাওয়া মানগুলো বসিয়ে দাও।

## ধাপ ৩: GitHub-এ আপলোড
1. [github.com](https://github.com) এ ফ্রি অ্যাকাউন্ট বানাও (না থাকলে)
2. নতুন Repository বানাও (নাম: `2ls-bazar`)
3. এই ফোল্ডারের সব ফাইল (firebaseConfig.js বসানোর পরে) সেখানে আপলোড করো

## ধাপ ৪: Vercel-এ ডিপ্লয়
1. [vercel.com](https://vercel.com) এ GitHub দিয়ে সাইন আপ করো
2. "Add New" → "Project" → তোমার `2ls-bazar` রিপোজিটরি সিলেক্ট করো → "Import"
3. Framework "Vite" অটো ডিটেক্ট হবে → "Deploy" ক্লিক করো

কয়েক মিনিটে একটা লিংক পাবে (যেমন `2ls-bazar.vercel.app`) — এখন থেকে অ্যাডমিন প্যানেল থেকে যা যোগ করবে, সব ভিজিটর সেটা দেখতে পাবে, কারণ ডেটা এখন Firebase-এ (সবার জন্য শেয়ার্ড) সেভ হচ্ছে।

## পাসকোড
অ্যাডমিন প্যানেলের ডিফল্ট পাসকোড: `2lsbazar`
(বদলাতে চাইলে `src/App.jsx` ফাইলে `2lsbazar` লেখাটা খুঁজে বদলে দাও)

## যদি firebaseConfig.js না বসাও
সমস্যা নেই — সাইট তখন localStorage দিয়ে চলবে (শুধু নিজের ব্রাউজারে সেভ থাকবে), সাইট ভাঙবে না। কিন্তু
সব কাস্টমারের জন্য একই প্রোডাক্ট দেখাতে চাইলে Firebase কনফিগ বসানো জরুরি।
