# 🕐 Shift Management System Guide

## Overview

The Shift Management System provides comprehensive control over staff schedules, time tracking, and access management for your restaurant POS system. This system ensures proper staff scheduling, prevents unauthorized access outside shift hours, and provides administrators with tools to manage exceptional cases.

## 🏗️ System Architecture

### Database Schema

#### Shift Model
```sql
- id: Primary key
- name: Shift name (e.g., "Morning Shift")
- startTime: Start time in HH:MM format
- endTime: End time in HH:MM format
- gracePeriod: Minutes before/after shift time (default: 10)
- isActive: Whether shift is active
- description: Optional description
- createdAt/updatedAt: Timestamps
```

#### ShiftLog Model
```sql
- id: Primary key
- userId: Reference to User
- shiftId: Reference to Shift
- type: CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END, OVERTIME_START, OVERTIME_END
- clockIn: Clock in timestamp
- clockOut: Clock out timestamp
- notes: Additional notes
- createdAt/updatedAt: Timestamps
```

#### User Model Updates
```sql
- shiftId: Optional reference to assigned shift
- shift: Relationship to Shift model
- shiftLogs: Relationship to ShiftLog model
```

## 🎯 Features

### 1. Shift Settings Management (Admin Only)

**Location**: Settings → Shift Management → Shift Settings

**Features**:
- Create new shifts with custom time ranges
- Edit existing shifts (name, times, grace period)
- Activate/deactivate shifts
- Delete shifts (only if no users assigned)
- View shift statistics (assigned users, logs)

**Default Shifts**:
- **Morning Shift**: 07:00 - 15:00 (10 min grace)
- **Afternoon Shift**: 15:00 - 23:00 (10 min grace)
- **Night Shift**: 23:00 - 07:00 (15 min grace)

### 2. User Shift Assignment (Admin Only)

**Location**: Settings → Shift Management → User Shift Assignment

**Features**:
- Assign shifts to staff members
- Remove users from shifts
- View current shift assignments
- See shift summary with assigned staff counts

**Process**:
1. Select user from dropdown
2. Choose shift from available active shifts
3. System automatically assigns user to shift

### 3. Clock In/Out System (All Staff)

**Location**: Settings → Shift Management → My Shift Status

**Features**:
- Real-time shift status display
- Clock in/out functionality
- Shift time validation
- Grace period handling
- Notes for clock in/out
- Auto-refresh every minute

**Validation Rules**:
- Users can only clock in during their assigned shift time (with grace period)
- Users must be clocked in to perform most system actions
- System prevents clock in outside shift hours
- Grace period allows early/late clock in/out

### 4. Admin Shift Control (Admin Only)

**Location**: Settings → Shift Management → Admin Shift Control

**Features**:
- View all currently active shifts
- Monitor staff clock-in status
- Extend shift duration
- Change user's shift assignment
- Force logout staff members
- Real-time monitoring dashboard

**Admin Actions**:
- **Extend Shift**: Add extra time to current shift
- **Change Shift**: Temporarily assign different shift
- **Force Logout**: Manually end staff session

## 🔧 API Endpoints

### Shift Management
```
GET    /api/shifts              - Get all shifts
GET    /api/shifts/:id          - Get single shift
POST   /api/shifts              - Create new shift
PUT    /api/shifts/:id          - Update shift
DELETE /api/shifts/:id          - Delete shift
POST   /api/shifts/:id/assign   - Assign user to shift
DELETE /api/shifts/:id/assign/:userId - Remove user from shift
GET    /api/shifts/active/status - Get active shifts
```

### Shift Logs
```
POST   /api/shift-logs/clock-in     - Clock in
POST   /api/shift-logs/clock-out    - Clock out
GET    /api/shift-logs/my-logs      - Get user's shift logs
GET    /api/shift-logs/my-status    - Get user's shift status
GET    /api/shift-logs/all          - Get all shift logs (admin)
POST   /api/shift-logs/extend/:userId - Extend shift (admin)
POST   /api/shift-logs/force-logout/:userId - Force logout (admin)
```

## 🛡️ Security & Validation

### Shift Validation Middleware

The system includes comprehensive middleware for shift validation:

1. **validateShiftAccess**: Full shift time and clock-in validation
2. **requireClockIn**: Only requires user to be clocked in
3. **checkShiftEnd**: Auto-logout when shift ends

### Access Control

- **Admins**: Full access to all shift management features
- **Cashiers**: Can view their shift status and clock in/out
- **Unauthorized Access**: Blocked with appropriate error messages

### Time Validation

- Supports overnight shifts (e.g., 23:00 - 07:00)
- Grace period handling for early/late access
- Real-time validation against current time
- Automatic session termination when shift ends

## 📱 User Interface

### Shift Management Tab Structure

1. **My Shift Status**: Personal clock in/out interface
2. **Shift Settings**: Admin shift configuration
3. **User Shift Assignment**: Staff assignment management
4. **Admin Shift Control**: Advanced admin tools

### Visual Indicators

- **Green**: Active/clocked in status
- **Red**: Inactive/outside shift time
- **Blue**: Ready to clock in
- **Yellow**: Warning states

### Real-time Updates

- Auto-refresh every 30-60 seconds
- Live status indicators
- Current time display
- Duration tracking

## 🚀 Getting Started

### 1. Initial Setup

1. **Create Shifts**: Go to Settings → Shift Management → Shift Settings
2. **Assign Staff**: Go to User Shift Assignment and assign shifts to users
3. **Test System**: Have staff clock in/out to verify functionality

### 2. Daily Operations

1. **Staff Clock In**: Staff clock in when starting their shift
2. **Monitor Activity**: Admins can monitor active shifts
3. **Handle Exceptions**: Use admin controls for special cases
4. **Staff Clock Out**: Staff clock out when ending their shift

### 3. Admin Management

1. **Monitor Dashboard**: Check active shifts regularly
2. **Handle Extensions**: Extend shifts when needed
3. **Manage Assignments**: Change shift assignments as needed
4. **Force Actions**: Use force logout for emergencies

## 🔄 Workflow Examples

### Morning Shift Start (7:00 AM)
1. Staff arrives at 6:55 AM (within 10-minute grace period)
2. Staff clocks in successfully
3. System validates shift time and allows access
4. Staff can perform all POS operations

### Shift End (3:00 PM)
1. Staff works until 3:10 PM (within grace period)
2. Staff clocks out manually
3. System logs the session duration
4. If staff forgets to clock out, system auto-logs out at 3:10 PM

### Emergency Extension
1. Restaurant is busy and needs extra staff
2. Admin extends shift by 30 minutes
3. Staff can continue working
4. System logs the extension with reason

### Force Logout
1. Staff member is not responding
2. Admin force logs out the user
3. System immediately ends the session
4. Staff must clock in again to continue

## 🎨 Customization

### Grace Periods
- Default: 10 minutes
- Night shift: 15 minutes
- Customizable per shift

### Shift Times
- Support for any time format (HH:MM)
- Overnight shifts supported
- 24-hour format recommended

### Validation Rules
- Configurable grace periods
- Custom shift validation logic
- Flexible time zone handling

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot clock in outside shift time"**
   - Check if user has assigned shift
   - Verify current time is within shift + grace period
   - Check shift is active

2. **"User is not clocked in"**
   - User must clock in before performing actions
   - Check if user has active shift assignment
   - Verify shift is active

3. **"Shift has ended"**
   - User's shift time has expired
   - Admin can extend shift if needed
   - User must clock out and wait for next shift

### Debug Information

- Check shift assignment in User Shift Assignment
- Verify shift times and grace periods
- Review shift logs for clock in/out history
- Check admin control panel for active sessions

## 📊 Reporting

### Shift Logs
- Complete clock in/out history
- Duration tracking
- Notes and reasons
- Admin actions log

### Active Monitoring
- Real-time staff status
- Current shift information
- Duration tracking
- Exception handling log

## 🔮 Future Enhancements

### Planned Features
- Shift templates
- Recurring shift schedules
- Break time tracking
- Overtime calculations
- Shift swap requests
- Mobile app integration
- SMS notifications
- Shift conflict detection

### Integration Opportunities
- Payroll systems
- Time tracking software
- HR management systems
- Employee scheduling apps

---

## 📞 Support

For technical support or feature requests related to the Shift Management System, please refer to the main system documentation or contact your system administrator.

**System Requirements**:
- Node.js 16+
- MySQL 8.0+
- React 18+
- Prisma ORM

**Last Updated**: January 2025
**Version**: 1.0.0


