import React, { useMemo, useState } from "react";
import "./menu.css";
import { useCart } from "../context/CartContext.jsx";

const DATA = {
  "Hot Beverages": [
    { id:"plain-tea", name:"Plain Ceylon Tea", price:600, rating:4.4, stock:60, img:"/src/assets/mock/tea.jpg" },
    { id:"milk-tea", name:"Milk Tea", price:800, rating:4.5, stock:55, img:"/src/assets/mock/tea-milk.jpg" },
    { id:"masala-chai", name:"Masala Chai", price:900, rating:4.7, stock:45, img:"/src/assets/mock/chai.jpg" },
    { id:"ginger-tea", name:"Ginger Tea", price:750, rating:4.5, stock:40, img:"/src/assets/mock/ginger-tea.jpg" },

    // Coffee Classics
    { id:"espresso", name:"Espresso (Single)", price:700, rating:4.6, stock:50, img:"/src/assets/mock/espresso.jpg" },
    { id:"americano", name:"Americano", price:850, rating:4.5, stock:50, img:"/src/assets/mock/americano.jpg" },
    { id:"cappuccino", name:"Cappuccino", price:1100, rating:4.6, stock:48, img:"/src/assets/mock/cappuccino.jpg" },
    { id:"latte", name:"Cafe Latte", price:1150, rating:4.6, stock:48, img:"/src/assets/mock/latte.jpg" },
    { id:"flat-white", name:"Flat White", price:1200, rating:4.6, stock:35, img:"/src/assets/mock/flatwhite.jpg" },
    { id:"mocha", name:"Caffè Mocha", price:1350, rating:4.7, stock:32, img:"/src/assets/mock/mocha.jpg" },
    { id:"macchiato", name:"Espresso Macchiato", price:950, rating:4.5, stock:30, img:"/src/assets/mock/macchiato.jpg" },
    { id:"irish-coffee", name:"Irish Coffee (non-alcoholic)", price:1500, rating:4.7, stock:20, img:"/src/assets/mock/irishcoffee.jpg" },

    // Chocolate & Specialty
    { id:"hot-chocolate", name:"Hot Chocolate", price:1100, rating:4.4, stock:35, img:"/src/assets/mock/hotchoc.jpg" },
    { id:"matcha-latte", name:"Matcha Latte", price:1500, rating:4.5, stock:25, img:"/src/assets/mock/matcha.jpg" },
  ],


  "Cold Beverages": [
    // Iced Coffee Classics
    { id:"iced-espresso", name:"Iced Espresso", price:1000, rating:4.4, stock:40, img:"/src/assets/mock/iced-espresso.jpg" },
    { id:"iced-americano", name:"Iced Americano", price:1100, rating:4.5, stock:45, img:"/src/assets/mock/iced-americano.jpg" },
    { id:"iced-latte", name:"Iced Latte", price:1350, rating:4.6, stock:45, img:"/src/assets/mock/iced-latte.jpg" },
    { id:"iced-cappuccino", name:"Iced Cappuccino", price:1350, rating:4.6, stock:40, img:"/src/assets/mock/iced-cappuccino.jpg" },
    { id:"iced-mocha", name:"Iced Mocha", price:1550, rating:4.7, stock:35, img:"/src/assets/mock/iced-mocha.jpg" },
    { id:"iced-macchiato", name:"Iced Caramel Macchiato", price:1650, rating:4.7, stock:30, img:"/src/assets/mock/iced-macchiato.jpg" },
    { id:"iced-flatwhite", name:"Iced Flat White", price:1450, rating:4.5, stock:28, img:"/src/assets/mock/iced-flatwhite.jpg" },

    // Cold Brew & Nitro
    { id:"cold-brew", name:"Cold Brew Coffee", price:1500, rating:4.6, stock:25, img:"/src/assets/mock/cold-brew.jpg" },
    { id:"vanilla-cold-brew", name:"Vanilla Sweet Cream Cold Brew", price:1650, rating:4.7, stock:20, img:"/src/assets/mock/cold-brew-vanilla.jpg" },
   
    // Frappés & Blended Coffees
    { id:"coffee-frappe", name:"Coffee Frappé", price:1600, rating:4.6, stock:30, img:"/src/assets/mock/frappe.jpg" },
    { id:"mocha-frappe", name:"Mocha Frappé", price:1650, rating:4.6, stock:28, img:"/src/assets/mock/frappe-mocha.jpg" },
    { id:"caramel-frappe", name:"Caramel Frappé", price:1700, rating:4.7, stock:25, img:"/src/assets/mock/frappe-caramel.jpg" },
    { id:"cookies-n-cream-frappe", name:"Cookies & Cream Frappe", price:1750, rating:4.7, stock:22, img:"/src/assets/mock/frappe-cookies.jpg" },

    // Signature Coffee Specials
    { id:"affogato", name:"Affogato (Espresso + Ice Cream)", price:1500, rating:4.8, stock:20, img:"/src/assets/mock/affogato.jpg" },
    { id:"vienna-iced-coffee", name:"Vienna Iced Coffee", price:1600, rating:4.6, stock:20, img:"/src/assets/mock/Vienna.jpg" },
    { id:"hazelnut-iced-latte", name:"Hazelnut Iced Latte", price:1450, rating:4.6, stock:25, img:"/src/assets/mock/hazelnut.jpg" },
    { id:"vanilla-iced-latte", name:"Vanilla Iced Latte", price:1450, rating:4.6, stock:25, img:"/src/assets/mock/vanilla.jpg" },

    // Iced Teas & Chillers
    { id:"lemon-iced-tea", name:"Lemon Iced Tea", price:900, rating:4.4, stock:55, img:"/src/assets/mock/lemon-iced-tea.jpg" },
    { id:"peach-iced-tea", name:"Peach Iced Tea", price:1000, rating:4.5, stock:50, img:"/src/assets/mock/peach-iced-tea.jpg" },
    { id:"green-iced-tea", name:"Iced Green Tea", price:950, rating:4.3, stock:45, img:"/src/assets/mock/green-iced-tea.jpg" },
    { id:"mint-lime-cooler", name:"Mint Lime Cooler", price:950, rating:4.5, stock:40, img:"/src/assets/mock/mint-lime.jpg" },
    { id:"faluda", name:"Faluda", price:1200, rating:4.6, stock:35, img:"/src/assets/mock/faluda.jpg" },

    // Fresh Juices
    { id:"mango-juice", name:"Mango Juice (Seasonal)", price:1100, rating:4.6, stock:30, img:"/src/assets/mock/mango-juice.jpg" },
    { id:"papaya-juice", name:"Papaya Juice", price:950, rating:4.4, stock:35, img:"/src/assets/mock/papaya.jpg" },
    { id:"passion-fruit-juice", name:"Passion Fruit Juice", price:1000, rating:4.5, stock:30, img:"/src/assets/mock/passion-fruit.jpg" },
    { id:"watermelon-juice", name:"Watermelon Juice", price:950, rating:4.4, stock:40, img:"/src/assets/mock/watermelon.jpg" },
    { id:"king-coconut", name:"King Coconut Water", price:400, rating:4.5, stock:50, img:"/src/assets/mock/kingcoconut.jpg" },

    // Smoothies & Shakes
    { id:"avocado-smoothie", name:"Avocado Smoothie", price:1500, rating:4.6, stock:25, img:"/src/assets/mock/avacado.jpg" },
    { id:"banana-milkshake", name:"Banana Milkshake", price:1200, rating:4.5, stock:35, img:"/src/assets/mock/banana-milkshake.jpg" },
    { id:"strawberry-milkshake", name:"Strawberry Milkshake", price:1400, rating:4.6, stock:30, img:"/src/assets/mock/strawberry-milkshake.jpg" },
    { id:"oreo-shake", name:"Oreo Shake", price:1600, rating:4.7, stock:28, img:"/src/assets/mock/oreo-shake.jpg" }
  ],
  "Cakes & Desserts": [
    { id:"choc-cake-slice", name:"Chocolate Cake (Slice)", price:1100, rating:4.7, stock:28, img:"/src/assets/mock/choc-cake-slice.jpg" },
    { id:"butter-cake-slice", name:"Butter Cake (Slice)", price:650, rating:4.4, stock:35, img:"/src/assets/mock/butter-cake-slice.jpg" },
    { id:"ribbon-cake-slice", name:"Ribbon Cake (Slice)", price:750, rating:4.5, stock:30, img:"/src/assets/mock/ribbon-cake-slice.jpg" },
    { id:"red-velvet-slice", name:"Red Velvet (Slice)", price:1300, rating:4.6, stock:24, img:"/src/assets/mock/red-velvet-slice.jpg" },
    { id:"cheesecake-slice", name:"Cheesecake (Slice)", price:1600, rating:4.6, stock:22, img:"/src/assets/mock/cheesecake-slice.jpg" },
    { id:"brownie", name:"Fudgy Brownie", price:950, rating:4.6, stock:40, img:"/src/assets/mock/brownie.jpg" },
    { id:"cbp", name:"Chocolate Biscuit Pudding", price:900, rating:4.8, stock:26, img:"/src/assets/mock/cbp.jpg" },
    { id:"watalappan", name:"Watalappan", price:900, rating:4.7, stock:20, img:"/src/assets/mock/watalappan.jpg" }
  ],

  "Cookies": [
    { id:"choc-chip-cookie", name:"Chocolate Chip Cookie", price:550, rating:4.5, stock:60, img:"/src/assets/mock/choco-chip-cookie.jpg" },
    { id:"cashew-cookie", name:"Cashew Cookie", price:600, rating:4.6, stock:55, img:"/src/assets/mock/cashew-cookie.jpg" },
    { id:"pistachio-cookie", name:"Pistacio Cookie", price:550, rating:4.5, stock:50, img:"/src/assets/mock/pistacio-cookie.jpg" },
    { id:"red-velvet-cookie", name:"Red velvet Cookie", price:500, rating:4.4, stock:50, img:"/src/assets/mock/red-velvet-cookie.jpg" },
    { id:"double-choc-cookie", name:"Double Chocolate Cookie", price:600, rating:4.5, stock:48, img:"/src/assets/mock/double-choc-cookie.jpg" },
    { id:"coconut-macaroon", name:"Coconut Macaroon", price:550, rating:4.5, stock:40, img:"/src/assets/mock/coconut-macaroon.jpg" },
    { id:"peanut-butter-cookie", name:"Peanut Butter Cookie", price:600, rating:4.5, stock:40, img:"/src/assets/mock/peanut-butter-cookie.jpg" },
    { id:"shortbread", name:"Shortbread", price:550, rating:4.4, stock:45, img:"/src/assets/mock/shortbread.jpg" }
  ],

  "Short-eats": [
    { id:"chicken-burger", name:"Fish Bun", price:380, rating:4.5, stock:70, img:"/src/assets/mock/chicken-burger.jpg" },
    { id:"chicken-wrap", name:"Chicken Wrap", price:450, rating:4.6, stock:65, img:"/src/assets/mock/wrap.jpg" },
    { id:"veg-samosa", name:"Vegetable Samosa", price:350, rating:4.4, stock:60, img:"/src/assets/mock/samosa.jpg" },
    { id:"egg-roll", name:"Egg Roll", price:450, rating:4.5, stock:55, img:"/src/assets/mock/egg-roll.jpg" },
    { id:"chicken-roll", name:"Chicken Roll", price:500, rating:4.6, stock:55, img:"/src/assets/mock/chicken-roll.jpg" },
    { id:"fish-cutlet", name:"Fish Cutlet", price:220, rating:4.6, stock:80, img:"/src/assets/mock/fish-cutlet.jpg" },
     { id:"chicken-cutlet", name:"Chicken Cutlet", price:220, rating:4.6, stock:80, img:"/src/assets/mock/chicken-cutlet.jpg" },
    { id:"sausage-bun", name:"Sausage Bun", price:420, rating:4.4, stock:60, img:"/src/assets/mock/sausage-bun.jpg" },
    { id:"cheese-ham-toastie", name:"Cheese & Ham Toastie", price:900, rating:4.5, stock:40, img:"/src/assets/mock/cheese-ham-toastie.jpg" },
    { id:"croissant", name:"croissant", price:250, rating:4.5, stock:75, img:"/src/assets/mock/croissant.jpg" }
  ],
};

export default function Menu(){
  const cats = useMemo(()=>Object.keys(DATA),[]);
  const [active, setActive] = useState(cats[0]);
  const [sort, setSort] = useState("popularity");
  const { add } = useCart();

  const items = [...DATA[active]];
  if(sort==="price-asc") items.sort((a,b)=>a.price-b.price);
  if(sort==="price-desc") items.sort((a,b)=>b.price-a.price);
  if(sort==="rating") items.sort((a,b)=>b.rating-a.rating);

  return (
    <section className="menu">
      <div className="menu-top">
        <h1>{items.length} items in {active}</h1>
        <label className="sort">Sorted by&nbsp;
          <select value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="popularity">popularity</option>
            <option value="rating">rating</option>
            <option value="price-asc">price ↑</option>
            <option value="price-desc">price ↓</option>
          </select>
        </label>
      </div>

      <div className="menu-layout">
        <aside className="cat-panel card">
          <h3>Categories</h3>
          <ul>
            {cats.map(c=>(
              <li key={c}><button className={`cat-pill ${active===c?'active':''}`} onClick={()=>setActive(c)}>{c}</button></li>
            ))}
          </ul>
        </aside>

        <div className="items-grid">
          {items.map(it=>(
            <article className="menu-card card" key={it.id}>
              <img src={it.img} alt={it.name} />
              <div className="mc-body">
                <div className="row" style={{justifyContent:"space-between"}}>
                  <h4>{it.name}</h4>
                  <div className="chip rating">★ {it.rating}</div>
                </div>
                <div className="muted small">Stock: {it.stock}</div>
                <div className="row mc-foot">
                  <div className="price">₹{it.price}</div>
                  <button className="btn add" onClick={()=>add({id:it.id,name:it.name,price:it.price})}>🛒 Add</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
