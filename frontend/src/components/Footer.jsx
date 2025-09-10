import React from "react";
import "./Footer.css";

export default function Footer(){
  return (
    <footer className="footer">
      <div className="f-inner">
        <div>© {new Date().getFullYear()} QWIK BREW</div>
        <div className="muted">Made with ❤️ for great coffee.</div>
      </div>
    </footer>
  );
}
