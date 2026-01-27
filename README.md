# ♻️ Smart Waste Management Syste

A web-based dashboard for managing and monitoring waste collection operations, including bins, routes, pickups, and complaints — built with **Vanilla JavaScript**, **HTML**, and **CSS**, powered by **Supabase**. 

**Live Demo**: [Explore the Smart Waste Management System](https://smart-waste-management-system1.vercel.app/)

---

## 🚀 Features

- **Dashboard Overview**:
  - View total bins, active bins, complaints, and pickups
  - Visual charts for quick insights

- **Bin Management**:
  - Track waste bins and their statuses
  - Relational mapping with routes

- **Route & Pickup Tracking**:
  - View assigned routes
  - Monitor recent pickups

- **Complaints & Maintenance**:
  - Log and view waste-related complaints and maintenance issues

- **Data Explorer**:
  - Inspect database tables and relationships
  - Useful for debugging and admin insights

---

## 🏗 Getting Started

Follow these steps to set up and run the project locally:

### Prerequisites

Make sure you have the following software installed:
- [Node.js](https://nodejs.org)
- [npm](https://www.npmjs.com/)
- [Vercel CLI](https://vercel.com/cli)
- A Supabase instance

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/wasif-rahman/smart-waste-management-system.git
   cd smart-waste-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and configure it with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧱 Tech Stack

### **Frontend**
- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js

### **Backend**
- Supabase (PostgreSQL)
- Supabase REST / JS Client

### **Deployment**
- Vercel

---

## 📑 Supabase Tables Schema 

Below are the database tables used in the project:

| **Table Name**     | **Key Attributes**                                                                                       |
|---------------------|-------------------------------------------------------------------------------------------------------|
| **Users**          | `user_id` (PK), `name`, `email`, `phone`, `role`, `password_hash`, `active`                           |
| **Zones**          | `zone_id` (PK), `name`, `boundary_geojson`, `manager_user_id` (FK)                                    |
| **Bins**           | `bin_id` (PK), `zone_id` (FK), `bin_type`, `latitude`, `longitude`, `install_date`, `status`          |
| **Devices**        | `device_id` (PK), `bin_id` (FK), `device_serial`, `model`, `install_date`, `status`                   |
| **Sensor_Readings**| `reading_id` (PK), `device_id` (FK), `timestamp`, `fill_level_percent`, `battery_level`               |
| **Trucks**         | `truck_id` (PK), `plate_no`, `capacity_kg`, `driver_user_id` (FK), `status`                           |
| **Routes**         | `route_id` (PK), `zone_id` (FK), `route_name`, `scheduled_days`, `avg_time_min`                      |
| **Route_Pickups**  | `pickup_id` (PK), `route_id` (FK), `bin_id` (FK), `truck_id` (FK), `scheduled_time`, `actual_time`, `status` |
| **Maint_Tickets**  | `ticket_id` (PK), `bin_id` (FK), `created_by` (FK), `assigned_to` (FK), `issue_desc`, `status`       |
| **Vendors**        | `vendor_id` (PK), `name`, `contact_person`, `phone`, `contract_start`, `contract_end`, `rate_per_ton`|
| **Complaints**     | `complaint_id` (PK), `bin_id` (FK), `user_id` (FK), `type`, `description`, `status`, `resolved_at`  |
| **Audit_Logs**     | `log_id` (PK), `user_id` (FK), `action`, `table_name`, `record_id`, `timestamp`, `details`           |

---

## 🧠 Key Highlights

- Built without frontend frameworks to enhance **core JavaScript fundamentals**
- Designed relational database schemas (bins, routes, complaints, pickups)
- Integrated and managed real-time data with **Supabase**
- Demonstrated async programming through data fetching and dynamic DOM manipulation
- Fully deployed and ready for production use

---

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. Fork this repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

---

## ❓ FAQ

**Q: How do I reset my password in the system?**  
A: Contact your platform admin to reset your password.

**Q: Is there any demo data available for testing?**  
A: Yes, the application includes sample data automatically populated when you deploy.
