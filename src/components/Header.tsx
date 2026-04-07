import { useState } from "react";
import { List } from "@phosphor-icons/react";
import "../styles/layout.css";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <header>
      <div className="main-wrapper">
        <section className="hero">
          <nav className="navbar">
            <div>
              <div className="logo">
                <img src="/images/logo.png" alt="Microhire" />
              </div>
            </div>

            <div className="tablet-menu">
              <div className="desktop-menu">
                <a href="#">What we do</a>
                <a href="#">Insights and Inspiration</a>
                <a href="#">Venue Partners</a>
                <a href="#">Our Story</a>
                <a href="#">Join Our Team</a>
                <div className="text-1">Get a Quote</div>
              </div>

              <div className="menu-1">
                <div className="text-mobile">Get a Quote</div>
                <div
                  className="mobile-menu"
                  onClick={toggleMenu}
                  onKeyDown={(e) => e.key === "Enter" && toggleMenu()}
                  role="button"
                  tabIndex={0}
                  aria-label="Toggle menu"
                >
                  <List size={24} weight="bold" />
                </div>

                <div
                  className={`mobile-menu-link ${menuOpen ? "active" : ""}`}
                  id="mobileMenu"
                >
                  <div className="menu-slide">
                    <a href="#" onClick={() => setMenuOpen(false)}>
                      What we do
                    </a>
                    <a href="#" onClick={() => setMenuOpen(false)}>
                      Insights and Inspiration
                    </a>
                    <a href="#" onClick={() => setMenuOpen(false)}>
                      Venue Partners
                    </a>
                    <a href="#" onClick={() => setMenuOpen(false)}>
                      Our Story
                    </a>
                    <a href="#" onClick={() => setMenuOpen(false)}>
                      Join Our Team
                    </a>
                  </div>
                  <div
                    className="mobile-menu-1"
                    onClick={toggleMenu}
                    onKeyDown={(e) => e.key === "Enter" && toggleMenu()}
                    role="button"
                    tabIndex={0}
                    aria-label="Close menu"
                  >
                    <List size={24} weight="bold" />
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <h1>New Westin Lead</h1>
        </section>
      </div>
    </header>
  );
}
