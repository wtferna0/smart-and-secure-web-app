// components/OrderSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // You can fetch order details here using orderId
    console.log('Order successful:', { orderId, paymentId });
  }, [orderId, paymentId]);

  return (
    <section className="checkout">
      <h1>Payment Successful! 🎉</h1>
      <div className="card c-pad">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2>Thank You for Your Order!</h2>
          <p>Your payment has been processed successfully.</p>
          
          <div style={{ margin: '2rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p><strong>Order ID:</strong> {orderId || 'N/A'}</p>
            <p><strong>Payment Reference:</strong> {paymentId || 'N/A'}</p>
          </div>
          
          <p>We've sent a confirmation email with your order details.</p>
          
          <div className="row" style={{ justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              View Order History
            </button>
            <button className="btn" onClick={() => navigate('/menu')}>
              Order More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccess;