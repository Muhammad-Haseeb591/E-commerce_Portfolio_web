import React, { useState, useRef, useEffect } from 'react'
import Navbar from './Navbar'
import { CiMenuBurger, CiHeart } from "react-icons/ci";
import { FiX } from "react-icons/fi";
import Sidebar from './Sidebar'
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import SearchBar from '../common/SearchBar';
import useAuth from "../hooks/useAuth";
import { logoutUser } from "../store/authSlice";
import { Package, Star } from "lucide-react";

const Header = () => {
  const [open, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!open);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await dispatch(logoutUser());
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  return (
    <div className='w-full bg-white lg:shadow-md lg:shadow-gray-100 sx:h-[95px] px-[17px] pt-[4px] relative md:top-[40px] lg:h-[106px] overflow-x-clip overflow-y-visible'>
      <div className='flex justify-between items-center w-full sx:h-[48px]'>
        <div className='sx:hidden lg:block size-[25px] mb-[15px]'>
          <div className='ml-[15px] mt-[5px] ' style={{ position: "absolute", left: "0", zIndex: "50" }}></div>
        </div>

        <div className='lg:hidden size-[25px] mb-[15px] '>
          <button
            className='lg:hidden ml-[15px] mt-[5px]'
            style={{ position: "absolute", left: "0", zIndex: "50" }}
            onClick={toggleSidebar}
          >
            {open ? (
              <FiX
                style={{
                  position: "fixed",
                  top: "16px",
                  right: "16px",
                  zIndex: "999",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "6px",
                  width: "40px",
                  height: "40px"
                }}
              />
            ) : (
              <CiMenuBurger className='size-[25px]' />
            )}
            {open && <Sidebar onClose={toggleSidebar} />}
          </button>
        </div>

        <div className='max-w-[200px] h-full flex items-center relative left-[15px]'>
  <Link to="/">
    <img
      className="logo-responsive relative md:left-[45px] w-full h-auto object-contain"
      src="https://res.cloudinary.com/dxqs4sg8j/image/upload/e_trim/w_600/v1784673289/Gemini_Generated_Image_42k8yv42k8yv42k8_qlrij0.png"
      alt="Portfolio_web PK"
      sizes="200px"
      loading="eager"
    />
  </Link>
</div>

        <div className='flex justify-between items-center'>
          <div className='items-center justify-center relative z-10 w-[95.125px] h-[20px] overflow-none box-border hidden md:block top-[-3px] '>
            <svg className=' w-5 h-5 text-gray-800 relative right-[5px] inline-block' aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17.8 13.938h-.011a7 7 0 1 0-11.464.144h-.016l.14.171c.1.127.2.251.3.371L12 21l5.13-6.248c.194-.209.374-.429.54-.659l.13-.155Z"/>
            </svg>
            <Link to='/map' className='font-normal text-[12px] relative leading-[2px] text-black/70 '>Store Locator</Link>
          </div>

          <span className='hidden md:block border-l-[1px] h-[20px] border-gray-400 mx-2'></span>

          <div className='inline-block '>
            <Link to="/cart">
              <span className='md:hidden'>
                <svg
                  className='mr-[6px] size-[25px] w-[25px] h-[25px] text-black/70'
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 512 512"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M80 176a16 16 0 0 0-16 16v216c0 30.24 25.76 56 56 56h272c30.24 0 56-24.51 56-54.75V192a16 16 0 0 0-16-16zm80 0v-32a96 96 0 0 1 96-96h0a96 96 0 0 1 96 96v32"></path>
                </svg>
              </span>
            </Link>
          </div>

          <div className="relative" ref={profileRef}>
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  className="header__icon--account full-unstyled-link focus-inset flex items-center cursor-pointer"
                >
                  <span>
                    {user.avatar && !avatarError ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        width="27"
                        height="27"
                        className="rounded-full object-cover"
                        style={{ width: "27px", height: "27px" }}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span
                        className="rounded-full bg-[#333333] text-white flex items-center justify-center text-[12px] font-semibold"
                        style={{ width: "27px", height: "27px" }}
                      >
                        {getInitials(user.fullName)}
                      </span>
                    )}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-[38px] w-[180px] bg-white border border-gray-200 rounded-[8px] shadow-md z-50 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[13px] font-medium text-black truncate">{user.fullName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>

                    <Link
                      to="/account/orders"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[13px] text-black/70 hover:text-black hover:bg-gray-50"
                    >
                      <Package className="size-[16px]" />
                      Order history
                    </Link>

                    <Link
                      to="/account/reviews"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[13px] text-black/70 hover:text-black hover:bg-gray-50"
                    >
                      <Star className="size-[16px]" />
                      My reviews
                    </Link>

                    <Link
                      to="/favourite"
                      onClick={() => setProfileMenuOpen(false)}
                      className="lg:hidden flex items-center gap-2 px-4 py-2 text-[13px] text-black/70 hover:text-black hover:bg-gray-50"
                    >
                      <CiHeart className="size-[16px]" />
                      Check your favourite
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-4 py-2 text-[13px] text-black/70 hover:text-black hover:bg-gray-50"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-[13px] text-black/70 hover:text-black hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="header__icon--account full-unstyled-link focus-inset">
                {/* ✅ lg screens pe icon hide, sirf "Sign in" text dikhega */}
                <span className='lg:hidden'>
                  <svg className="icon header_login-icon" viewBox="0 0 22 22" id="profile-picture" width="27" height="27" xmlns="http://www.w3.org/2000/svg">
                    <path className="bspinterest-path-1" d="M21 11a10 10 0 01-10 10A10 10 0 011 11 10 10 0 0111 1a10 10 0 0110 10z"></path><path fill="#fff" fillRule="evenodd" d="M11.01 1A10.014 10.014 0 001 11.01a9.911 9.911 0 002.6 6.707c1.441-.7.921-.12 2.8-.9a22.34 22.34 0 002.4-1.081l.02-1.842a3.532 3.532 0 01-.961-2.282c-.46.14-.6-.521-.641-.941-.02-.4-.26-1.682.3-1.562a10.593 10.593 0 01-.16-2.022 3.69 3.69 0 013.652-3.024c2.5.1 3.483 1.6 3.624 3a10.809 10.809 0 01-.16 2.022c.561-.12.32 1.161.28 1.562-.02.42-.18 1.081-.641.941a3.412 3.412 0 01-.961 2.282l.02 1.822s.46.26 2.4 1.061c1.9.781 1.361.24 2.823.941A9.977 9.977 0 0011.01 1z" className="bspinterest-path-2"></path><path className="bspinterest-path-3" d="M11 .5C5.207.5.5 5.207.5 11S5.207 21.5 11 21.5 21.5 16.793 21.5 11 16.793.5 11 .5zm0 1c5.253 0 9.5 4.247 9.5 9.5s-4.247 9.5-9.5 9.5A9.492 9.492 0 011.5 11c0-5.253 4.247-9.5 9.5-9.5z"></path><path className="bspinterest-path-4" d="M11 1C5.483 1 1 5.483 1 11s4.483 10 10 10 10-4.483 10-10S16.517 1 11 1zm0 1c4.976 0 9 4.024 9 9s-4.024 9-9 9-9-4.024-9-9 4.024-9 9-9z"></path>
                  </svg>
                </span>
                <p className='hidden md:block  h-[20px]  border-gray-400 font-normal text-[12px] pl-[5px] pt-[10px] cursor-pointer leading-[2px] text-black/70'>Sign in</p>
              </Link>
            )}
          </div>
        </div>
      </div>

      <Navbar/>
    </div>
  )
}

export default Header