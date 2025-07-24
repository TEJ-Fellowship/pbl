// import React from "react";
import { MdMail } from "react-icons/md";
import { FaPhone, FaFacebookF, FaYoutube, FaTwitter } from "react-icons/fa";
import { FaMapMarkerAlt } from "react-icons/fa";
import { PiInstagramLogoFill } from "react-icons/pi";
import "./footer.css";

const visitSection = [
  { id: 1, icon: <FaMapMarkerAlt />, content: "Kathmandu, Nepal" },
  { id: 2, icon: <FaPhone />, content: <a href="tel:0123456789">+977-9818776046</a> },
  { id: 3, icon: <MdMail />, content: <a href="mailto:moviemagic@gmail.com">moviemagic@gmail.com</a> },
];

const socials = [
  { id: 1, icon: <FaFacebookF />, link: "#" },
  { id: 2, icon: <FaTwitter />, link: "#" },
  { id: 3, icon: <FaYoutube />, link: "#" },
  { id: 4, icon: <PiInstagramLogoFill />, link: "#" },
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section left">
          <h5>Movie Magic</h5>
          <p>Stream. Watch. Enjoy Movies Anytime!</p>
        </div>

        <div className="footer-section center">
          <h5>Contact Us</h5>
          {visitSection.map(({ id, icon, content }) => (
            <div key={id} className="footer-contact-item">
              {icon}
              <p>{content}</p>
            </div>
          ))}
        </div>

        <div className="footer-section right">
          <h5>Follow Us</h5>
          <div className="social-icons">
            {socials.map(({ id, icon, link }) => (
              <a key={id} href={link} target="_blank" rel="noopener noreferrer">
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <hr className="divider" />
      <p className="footer-copy">&copy; 2025 Movie Magic. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
