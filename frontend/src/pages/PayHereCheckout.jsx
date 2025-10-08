// components/PayHereCheckout.jsx
import React from 'react';

const PayHereCheckout = ({ formData, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Debug: Check all form fields before submission
    console.log('🔍 All PayHere Form Fields:');
    Object.entries(formData.form_fields).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Check for missing required fields
    const requiredFields = ['merchant_id', 'return_url', 'cancel_url', 'notify_url', 'order_id', 'items', 'amount', 'currency'];
    const missingFields = requiredFields.filter(field => !formData.form_fields[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      alert(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    console.log('✅ All required fields present, submitting...');
    const form = document.getElementById('payhere-form');
    if (form) {
      form.submit();
    }
  };

  return (
    <div className="payhere-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Redirecting to PayHere</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        
        <p>You will be redirected to PayHere to complete your payment securely.</p>
        
        <form 
          id="payhere-form" 
          method="POST" 
          action={formData.action_url}
          onSubmit={handleSubmit}
        >
          {Object.entries(formData.form_fields).map(([key, value]) => (
            <input 
              key={key}
              type="hidden" 
              name={key} 
              value={value} 
            />
          ))}
          
          <div className="row" style={{ gap: '10px', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              Proceed to PayHere
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
        
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
          <p className="small muted">
            <strong>Secure Payment:</strong> Your payment details are processed securely by PayHere. 
            We never store your card information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayHereCheckout;