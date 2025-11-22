import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AssetsManagement from '../pages/AssetsManagement';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/assets" replace />} />
        <Route path="/assets" element={<AssetsManagement />} />
      </Routes>
    </BrowserRouter>
  );
}
