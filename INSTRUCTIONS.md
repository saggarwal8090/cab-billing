# Parvati Trading Co. - Cab Billing Management System

A professional, real-working business software for cab trip management, billing, and record keeping.

## 🚀 Quick Start Instructions

Follow these steps to run the software on your machine:

1. **Terminal 1: Start Backend**
   ```bash
   cd server
   node index.js
   ```
   *The server will run on port 5001.*

2. **Terminal 2: Start Frontend**
   ```bash
   cd client
   npm run dev
   ```
   *Open [http://localhost:5173](http://localhost:5173) in your browser.*

---

## ✨ Core Features

### 1. Multi-Trip Management
- Add unlimited trips under a single customer record.
- Each trip tracks: Date, From/To, Opening/Closing KM, DA, Night Charges, Toll/Parking, and Remarks.
- Automatic calculation of **Total KM** and **Base Fare**.

### 2. Custom Business Rules (Implemented)
- **Minimum KM Rule**: Default 250 KM per day (configurable).
- **Halt Day Logic**: Option to mark specific days as "Halt Days" to bypass Minimum KM rule and bill based on actual usage.
- **Night Halt Rule**: Visual indicator/recommendation for night halt charges based on trip duration (from 2nd night onwards).
- **Dynamic Rates**: Configure per-KM rates for different car types (Innova, Sedan, etc.) in Settings.

### 3. Professional Output
- **Formal Tax Invoice**: Clean, high-fidelity printable invoice with Bill Number, Company Header, and Signature section.
- **Internal Summary**: A data-focused report without formal branding for office record keeping.
- **PDF Export**: Single-click PDF generation.

### 4. Admin & History
- **Dashboard**: Quick stats (Total Bills vs Summaries) and Recent Records.
- **History**: Full searchability by Customer Name, Vehicle Number, or Bill Number. Edit/Reprint/Delete capabilities.
- **Settings**: Complete control over Company Info, Address, Rates, and Default Rules.

---

## 🏗️ Technical Stack

- **Frontend**: React (Vite), Lucide Icons, Vanilla CSS (Premium Design System).
- **Backend**: Node.js, Express.
- **Database**: SQLite (No installation required).
- **Utilities**: `html2pdf.js` for exports, `axios` for API communication.
