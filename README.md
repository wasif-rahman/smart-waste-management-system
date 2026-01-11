# ♻️ Smart Waste Management System

A web-based dashboard for managing and monitoring waste collection operations, including bins, routes, pickups, and complaints — built with **Vanilla JavaScript**, **HTML**, and **CSS**, powered by **Supabase** and deployed on **Vercel**.

##  Features

- 📊 **Dashboard Overview**
  - Total bins, active bins, complaints, and pickups
  - Visual charts for quick insights

- 🗑 **Bin Management**
  - Track waste bins and their statuses
  - Relational mapping with routes

- 🚛 **Route & Pickup Tracking**
  - View assigned routes
  - Monitor recent pickups

- 🛠 **Complaints & Maintenance**
  - Log and view waste-related complaints
  - Track maintenance issues

- 🧩 **Data Explorer**
  - Inspect database tables and relationships
  - Useful for debugging and admin insights

---

## 🛠 Tech Stack

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js

**Backend**
- Supabase (PostgreSQL)
- Supabase REST / JS Client

**Deployment**
- Vercel

---

## 🧠 Key Highlights

- Built without frontend frameworks to strengthen **core JavaScript fundamentals**
- Designed relational database schemas (bins, routes, complaints, pickups)
- Integrated real-time backend data using Supabase
- Implemented async data fetching and DOM manipulation
- Fully deployed and production-ready

---

## ⚙️ Environment Variables

Create a `.env` file and add:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
