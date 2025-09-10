import React, { createContext, useContext, useMemo, useState } from "react";

const CartCtx = createContext();

export function CartProvider({ children }){
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const add = (item)=>{
    setItems(prev=>{
      const i = prev.findIndex(p=>p.id===item.id);
      if(i>-1){
        const next=[...prev]; next[i]={...next[i], qty: next[i].qty+1}; return next;
      }
      return [...prev, {...item, qty:1}];
    });
    setOpen(true);
  };
  const remove = (id)=> setItems(prev=>prev.filter(p=>p.id!==id));
  const inc = (id)=> setItems(prev=>prev.map(p=>p.id===id?{...p, qty:p.qty+1}:p));
  const dec = (id)=> setItems(prev=>prev.map(p=>p.id===id?{...p, qty:Math.max(1,p.qty-1)}:p));
  const clear = ()=> setItems([]);
  const total = useMemo(()=> items.reduce((s,i)=>s + i.price*i.qty, 0), [items]);

  return (
    <CartCtx.Provider value={{items, add, remove, inc, dec, clear, total, open, setOpen}}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = ()=> useContext(CartCtx);
