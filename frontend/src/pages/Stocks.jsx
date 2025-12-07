import { Navigate } from 'react-router-dom';

export default function Stocks() {
  // Stocks feature removed — redirect to Accounts
  return <Navigate to="/accounts" replace />;
}