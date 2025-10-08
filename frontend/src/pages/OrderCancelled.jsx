// components/OrderCancelled.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderCancelled = () => {
  const navigate = useNavigate();

  return (
    <section className="checkout">
      <h1>Payment Cancelled</h1>
      <div className="card c-pad">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2>Payment Was Cancelled</h2>
          <p>Your payment process was cancelled. No charges were made.</p>
          
          <div className="row" style={{ justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/checkout')}>
              Return to Checkout
            </button>
            <button className="btn" onClick={() => navigate('/menu')}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderCancelled;