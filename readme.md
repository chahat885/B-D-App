# Badminton Court Booking App

## Problem Statement

Currently, all badminton court bookings and user registrations are managed offline, requiring physical presence for registration and slot booking. This leads to inefficiencies, double bookings, and inconvenience for both users and administrators.

## Solution

This web application digitizes the entire process, allowing users to:
- Register and log in online
- View available court slots
- Book courts and manage their bookings
- Admins can manage slots, view all bookings, and perform administrative tasks

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Authentication:** JWT-based
- **Email Service:** (Optional) Nodemailer for notifications

## Features

- User registration and login
- Real-time slot availability
- Online court booking and cancellation
- Admin dashboard for slot and booking management
- Responsive UI with light/dark mode

## Project Structure

### Backend

- `src/index.js`: Express server entry point
- `lib/db.js`: MongoDB connection
- `lib/emailService.js`: Email notifications
- `middleware/auth.js`: Auth middleware
- `models/`: Mongoose models for User, Slot, Booking
- `routes/`: Express routes for auth, bookings, slots
- `services/slotCleanupService.js`: Cleans up expired slots

### Frontend

- `src/App.jsx`: Main app component
- `src/main.jsx`: React entry point
- `src/components/`: UI components (Navbar, BookingModal, etc.)
- `src/pages/`: Page components (Login, Admin, Calendar, etc.)
- `src/contexts/ThemeContext.jsx`: Theme management

## How to Run

1. **Backend**
   - `cd backend`
   - `npm install`
   - `npm start`

2. **Frontend**
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## License

MIT