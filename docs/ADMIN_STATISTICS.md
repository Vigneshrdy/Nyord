# Admin Statistics Page

## Overview
Comprehensive analytics dashboard for administrators with 8+ interactive charts and real-time statistics.

## Features

### 1. **Overview Statistics Cards**
- Total Accounts with growth percentage
- Total Loans with trend indicator
- Total Cards issued
- Total Transactions processed

### 2. **Timeframe Toggle**
- Switch between Weekly and Monthly views
- Real-time data updates based on selected timeframe

### 3. **Current Period Stats**
- Accounts created (This Week/Month)
- Loans approved (This Week/Month)
- Cards issued (This Week/Month)

### 4. **8 Interactive Charts**

#### Chart 1: Approvals Overview (Area Chart)
- Stacked area chart showing accounts, loans, and cards over time
- Weekly: 7 days breakdown
- Monthly: 12 months breakdown

#### Chart 2: Account Types Distribution (Pie Chart)
- Savings accounts
- Checking accounts
- Business accounts

#### Chart 3: Loan Types Distribution (Pie Chart)
- Personal loans
- Home loans
- Auto loans

#### Chart 4: Card Types Distribution (Bar Chart)
- Standard cards
- Gold cards
- Platinum cards
- Premium cards

#### Chart 5: Transaction Analytics (Dual-Axis Line Chart)
- Transaction volume count
- Total transaction amount
- Weekly breakdown

#### Chart 6: Approval Rates (Stacked Bar Chart)
- Account approval vs rejection rates
- Loan approval vs rejection rates
- Card approval vs rejection rates

#### Chart 7: User Growth Trend (Area Chart)
- Total users over time
- Active users over time
- 9-month trend view

#### Chart 8: Performance Comparison (Multi-Bar Chart)
- Side-by-side comparison of accounts, loans, and cards
- Adjusts based on weekly/monthly timeframe

## Navigation
Access via Admin Sidebar: **Admin Panel → Statistics**

## Technology Stack
- **Recharts**: Interactive chart library
- **React**: Component framework
- **Tailwind CSS**: Styling
- **Lucide Icons**: Icon library

## API Integration (TODO)
Currently uses mock data. Connect to these endpoints:
- `GET /api/admin/statistics/overview`
- `GET /api/admin/statistics/weekly`
- `GET /api/admin/statistics/monthly`
- `GET /api/admin/statistics/approval-rates`
- `GET /api/admin/statistics/user-growth`

## Responsive Design
- Mobile: Single column layout
- Tablet: 2-column grid for pie charts
- Desktop: 3-column grid for cards, optimized chart sizes

## Color Scheme
- Blue (#3b82f6): Accounts
- Green (#10b981): Loans  
- Purple (#8b5cf6): Cards
- Orange (#f59e0b): Transactions
- Red (#ef4444): Rejections

## Future Enhancements
- Export data to CSV/PDF
- Date range picker for custom periods
- Real-time data streaming
- Comparison with previous periods
- Predictive analytics
- Email reports scheduling
