import { InstagramLogo } from "@phosphor-icons/react";
import "../styles/layout.css";

export function Footer() {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-col-wrapper">
            <div className="footer-col">
              <h3>Where To Find Us</h3>
              <ul>
                <li>
                  <a href="tel:+611300347652">
                    1300 347 652 <span className="line"></span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Locations <span className="line"></span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Make a Payment <span className="line"></span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>What We Do</h3>
              <ul>
                <li>
                  <a href="#">
                    AV & Event Services <span className="line"></span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Exhibition Technology <span className="line"></span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Production IT Hire <span className="line"></span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    Managed AV Services <span className="line"></span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="member-logo">
            <h5>Proud member of</h5>
            <div className="img-wrapper">
              <a href="#">
                <img src="/images/footer-member-img-1.png" alt="" />
              </a>
            </div>
            <div className="img-wrapper">
              <a href="#">
                <img src="/images/footer-member-img-2.png" alt="" />
              </a>
            </div>
            <div className="img-wrapper">
              <a href="#">
                <img src="/images/footer-member-img-3.png" alt="" />
              </a>
            </div>
            <div className="img-wrapper">
              <a href="#">
                <img src="/images/footer-member-img-4.png" alt="" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-col">
            <h3>Join Us Online</h3>
            <div className="social-page-instragrm">
              <div>
                <img src="/images/microhire_apac.webp" alt="" />
              </div>
              <div>
                <h3>microhire_apac</h3>
                <p>Events That Inspire ✨️ · 1300 667 095</p>
              </div>
            </div>
            <div className="footer-sub-images">
              <a href="#">
                <img src="/images/footer-sub-img-1.webp" alt="" />
              </a>
              <a href="#">
                <img src="/images/footer-sub-img-2.webp" alt="" />
              </a>
              <a href="#">
                <img src="/images/footer-sub-img-3.webp" alt="" />
              </a>
            </div>
            <div className="buttton-wrapper">
              <a href="#">Load More</a>
              <a href="#">
                <InstagramLogo size={18} weight="fill" style={{ marginRight: 8, verticalAlign: "middle" }} />
                Follow on Instagram
              </a>
            </div>
            <div className="post-wrapper">
              <div className="author-card">
                <div className="author-img">
                  <img src="/images/author-img.jpg" alt="" />
                </div>
                <div className="author-text">
                  <p className="author-name">
                    Microhire is at Mornington Peninsula.
                  </p>
                  <p className="post-time">1 month ago</p>
                </div>
              </div>
              <p className="post-description">
                ✨ Branding Meets Brilliance ✨
                <br />
                <br />
                Microhire brought the magic with a mesmerising "light‑scape" at
                the Mornington Peninsula Thermal Springs. ✨️
                <br />
                <br />
                <a href="#">#EventLighting</a> <a href="#">#Design</a>{" "}
                <a href="#">#Event</a> <a href="#">#Production</a>{" "}
                <a href="#">#ProjectionMapping</a>{" "}
                <a href="#">#EventsThatInspire</a> <a href="#">#Microhire</a> ✨
              </p>
              <a href="#" className="see-more-dot">
                ...
              </a>
              <a href="#" className="see-more">
                see more
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h3>Follow us on social media</h3>
            <div className="social-icons">
              <a href="#" aria-label="X Twitter">
                𝕏
              </a>
              <a href="#" aria-label="Facebook">
                f
              </a>
              <a href="#" aria-label="LinkedIn">
                in
              </a>
              <a href="#" aria-label="YouTube">
                ▶
              </a>
              <a href="#" aria-label="Instagram">
                📷
              </a>
            </div>
            <h3>Subscribe To Stay Ahead</h3>
            <div className="subscribe">
              <input type="text" placeholder="Name" />
              <input type="email" placeholder="Email" />
              <button type="button">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
