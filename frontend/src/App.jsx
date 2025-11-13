// src/App.jsx
import { Routes, Route } from 'react-router';
import Navbar from './components/Navbar';
import Landing from './views/Landing';
import BookDetails from './views/BookDetails';
import UserPage from './views/UserPage';
import Login from './views/Login';
import Register from './views/Register';

function App() {
  return (
    <div className="min-h-screen bg-pastel-yellow">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/user/:username" element={<UserPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;