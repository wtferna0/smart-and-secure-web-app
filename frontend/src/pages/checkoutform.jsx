import React, { useState } from 'react';

const CheckoutForm = () => {
  const [promoCode, setPromoCode] = useState('');  // Store the entered promo code
  const [orderTotal, setOrderTotal] = useState(100);  // Example initial order total
  const [pointsToRedeem, setPointsToRedeem] = useState(0);  // Store the points to redeem
  const token = 'your-auth-token-here';  // Replace with actual token

  // Function to handle applying a promo code
  const applyPromo = (promoCode) => {
    fetch('/api/promos/apply/', {
      method: 'POST',
      body: JSON.stringify({ order_id: 10, code: promoCode }),  // Pass relevant order ID
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // Pass the JWT token in headers
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        // Update the order total with the new total after applying the promo
        setOrderTotal(data.total);
        alert('Promo applied successfully!');
      } else {
        alert('Promo application failed: ' + data.error);
      }
    });
  };

  // Function to handle redeeming points
  const redeemPoints = (points) => {
    fetch('/api/loyalty/redeem/', {
      method: 'POST',
      body: JSON.stringify({ order_id: 10, points: points }),  // Pass relevant order ID
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // Pass the token
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        // Update the order total after redeeming points
        setOrderTotal(data.total);
        alert('Points redeemed successfully!');
      } else {
        alert('Points redemption failed: ' + data.error);
      }
    });
  };

  return (
    <div>
      <h1>Checkout Form</h1>

      {/* Promo code section */}
      <div>
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}  // Handle promo code input
          placeholder="Enter promo code"
        />
        <button onClick={() => applyPromo(promoCode)}>Apply Promo</button>
      </div>

      {/* Loyalty points section */}
      <div>
        <input
          type="number"
          value={pointsToRedeem}
          onChange={(e) => setPointsToRedeem(Number(e.target.value))}  // Handle points input
          placeholder="Enter points to redeem"
        />
        <button onClick={() => redeemPoints(pointsToRedeem)}>Redeem Points</button>
      </div>

      {/* Display the updated order total */}
      <p>Order Total: {orderTotal}</p>
    </div>
  );
};

export default CheckoutForm;
