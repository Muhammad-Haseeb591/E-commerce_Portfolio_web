import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { FaFacebookF, FaPinterestP, FaInstagram, FaTiktok, FaYoutube, FaUser } from 'react-icons/fa'
import { IoChevronForward } from 'react-icons/io5'
import useAuth from '../hooks/useAuth'
import { logoutUser } from '../redux_Toolkit/authSlice'

const menuItems = [
  { name: 'NEW', to: '/new', img: 'https://cdn.pixabay.com/photo/2013/04/27/09/30/shoes-107401_1280.jpg' },
  { name: 'WOMEN', to: '/women', img: 'https://res.cloudinary.com/dxqs4sg8j/image/upload/v1783365564/LadiesShoes_ltocgd.jpg' },
  { name: 'MEN', to: '/men', img: 'https://res.cloudinary.com/dxqs4sg8j/image/upload/v1765427130/cld-sample-5.jpg' },
  { name: 'KIDS', to: '/kids', img: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200&h=200&fit=crop' },
  { name: 'FRAGRANCES', to: '/fragrances', img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop' },
  { name: 'ACCESSORIES', to: '/accessories', img: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop' },
  { name: 'GET INSPIRED', to: '/getinspired', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=200&fit=crop' },
  { name: 'SALES', to: '/sales', text: 'text-red-600', img: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=200&h=200&fit=crop' },
];
const socialLinks = [
  { href: 'https://facebook.com', icon: FaFacebookF, label: 'Facebook', className: 'hover:bg-[#1877f2] hover:text-white hover:border-[#1877f2]' },
  { href: 'https://pinterest.com', icon: FaPinterestP, label: 'Pinterest', className: 'hover:bg-[#e60023] hover:text-white hover:border-[#e60023]' },
  { href: 'https://instagram.com', icon: FaInstagram, label: 'Instagram', className: 'hover:bg-[#e4405f] hover:text-white hover:border-[#e4405f]' },
  { href: 'https://tiktok.com', icon: FaTiktok, label: 'TikTok', className: 'hover:bg-black hover:text-white hover:border-black' },
  { href: 'https://youtube.com', icon: FaYoutube, label: 'YouTube', className: 'hover:bg-[#ff0000] hover:text-white hover:border-[#ff0000]' },
]

const Sidebar = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await dispatch(logoutUser());
    onClose();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  // Dropdown ke bahar click karne pe band ho jaye
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed top-0 left-0 z-50 flex h-[100dvh] w-[75vw] flex-col bg-white shadow-[4px_0_24px_rgba(0,0,0,0.12)] sm:w-[min(85vw,360px)] md:w-[min(80vw,400px)] lg:hidden">
        <div className="border-b border-gray-100 bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 sm:text-[11px]">
                Welcome to
              </p>
              <h2 className="truncate text-sm font-bold tracking-tight text-gray-900 sm:text-base">
                WWW.Port_Site.COM
              </h2>
            </div>

           
            {isLoggedIn ? (
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-3 py-2 text-white transition-colors hover:bg-gray-700 sm:gap-2 sm:px-4 sm:py-2.5"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="size-4 sm:size-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center size-4 sm:size-5 rounded-full bg-white text-gray-900 text-[9px] font-bold">
                      {getInitials(user.fullName)}
                    </span>
                  )}
                  <span className="text-xs font-semibold sm:text-sm truncate max-w-[80px]">
                    {user.fullName}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-[44px] w-[180px] bg-white border border-gray-200 rounded-[8px] shadow-md z-50 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[13px] font-medium text-black truncate">{user.fullName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => { setProfileMenuOpen(false); onClose(); }}
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
              </div>
            ) : (
              <Link
                to="/login"
                onClick={onClose}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-3 py-2 text-white transition-colors hover:bg-gray-700 sm:gap-2 sm:px-4 sm:py-2.5"
              >
                <FaUser className="text-xs sm:text-sm" />
                <span className="text-xs font-semibold sm:text-sm">Sign in</span>
              </Link>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain py-1">
          <ul className="divide-y divide-gray-50">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 sm:px-6 sm:py-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-gray-100 sm:size-14">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <span
                      className={`truncate text-sm font-medium tracking-tight text-gray-800 transition-transform duration-200 group-hover:translate-x-0.5 sm:text-base ${
                        item.text ?? ''
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  <IoChevronForward className="size-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-600 sm:size-5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-6 sm:py-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 sm:text-[11px]">
            Follow us
          </p>
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {socialLinks.map(({ href, icon: Icon, label, className }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-all duration-200 sm:size-10 ${className}`}
              >
                <Icon size={15} className="sm:text-[16px]" />
              </a>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar