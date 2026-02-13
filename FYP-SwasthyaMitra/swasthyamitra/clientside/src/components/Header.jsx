import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Header = () => {
  return (
    <div className="relative flex flex-col md:flex-row flex-wrap bg-primary rounded-2xl px-6 md:px-10 lg:px-16 overflow-visible">
      {/* Left: headline, avatars, description, CTA */}
      <div className="relative md:w-1/2 flex flex-col items-start justify-center gap-5 py-10 md:py-12 lg:py-14">
        <h1 className="text-3xl md:text-4xl lg:text-5xl text-white font-bold leading-tight">
          Book appointment with <br /> trusted doctors
        </h1>
        <div className="flex items-center gap-3">
          <img className="w-12 h-12 rounded-full border-2 border-white/40 object-cover" src={assets.group_profiles} alt="" />
          <p className="text-white/95 text-sm md:text-base max-w-md">
            Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
          </p>
        </div>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 bg-white text-gray-800 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
        >
          Book appointment
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
      {/* Right: image — overflow-hidden clips any square edges or artifacts */}
      <div className="relative md:w-1/2 flex items-end justify-center md:justify-end pt-6 md:pt-0 overflow-hidden">
        <div className="w-full max-w-md md:max-w-none md:w-[90%] lg:w-full overflow-hidden rounded-xl md:rounded-l-none shadow-2xl">
          <img
            className="w-full h-auto block object-cover object-bottom"
            src={assets.header_img}
            alt="Healthcare professionals"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
