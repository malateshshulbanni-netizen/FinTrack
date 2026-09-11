import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TransactionForm from './pages/TransactionForm';

function App() {
  return (
    <div className="min-h-screen bg-fintrack-background">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="w-80"
      />
      <TransactionForm />
    </div>
  );
}

export default App;