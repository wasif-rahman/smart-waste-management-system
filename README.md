# ♻️ Smart Waste Management System

A web-based dashboard for managing and monitoring waste collection operations, including bins, routes, pickups, and complaints — built with **Vanilla JavaScript**, **HTML**, and **CSS**, powered by **Supabase** and deployed on **Vercel**.

##  Live Demo
🔗 https://smart-waste-management-system1.vercel.app/

---

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
- Vanilla JavaScript.
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
## supabase Tables Schema 
#	Table Name	Key Attributes
1	Users	user_id (PK), name, email, phone, role, password_hash, active
2	Zones	zone_id (PK), name, boundary_geojson, manager_user_id (FK)
3	Bins	bin_id (PK), zone_id (FK), bin_type, latitude, longitude, install_date, status
4	Devices	device_id (PK), bin_id (FK), device_serial, model, install_date, status
5	Sensor_Readings	reading_id (PK), device_id (FK), timestamp, fill_level_percent, battery_level
6	Trucks	truck_id (PK), plate_no, capacity_kg, driver_user_id (FK), status
7	Routes	route_id (PK), zone_id (FK), route_name, scheduled_days, avg_time_min
8	Route_Pickups	pickup_id (PK), route_id (FK), bin_id (FK), truck_id (FK), scheduled_time, actual_time, status
9	Maint_Tickets	ticket_id (PK), bin_id (FK), created_by (FK), assigned_to (FK), issue_desc, status
10	Vendors	vendor_id (PK), name, contact_person, phone, contract_start, contract_end, rate_per_ton
11	Complaints	complaint_id (PK), bin_id (FK), user_id (FK), type, description, status, resolved_at
12	Audit_Logs	log_id (PK), user_id (FK), action, table_name, record_id, timestamp, details

## ⚙️ Environment Variables

Create a `.env` file and add:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key


