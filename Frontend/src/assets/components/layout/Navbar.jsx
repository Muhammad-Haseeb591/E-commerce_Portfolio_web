import React, { useState, useEffect } from 'react'
import { IoBagOutline } from "react-icons/io5";
import { CiHeart } from "react-icons/ci";
import { NavLink, Link } from "react-router-dom";
import SearchBar from '../common/SearchBar';
import { useDispatch, useSelector } from 'react-redux'
import { setFilter } from '../store/fetcherSlice'

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const dispatch = useDispatch();

  const { filters } = useSelector((state) => state.FetchPrducts);

  const [query, setQuery] = useState(filters.search || "");

  useEffect(() => {
    if (!filters.search) {
      setQuery("");
    }
  }, [filters.search]);

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   dispatch(setFilter({ key: "search", value: query.trim() }));
  //   setQuery("");
  // };

  const navLinks = [
    {
      to: "/",
    }, {
      name: "NEW",
      to: "/new",
      hoverImage: "https://plus.unsplash.com/premium_photo-1665413642308-c5c1ed052d12?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      hoverDetails: [
        {
          section: "NEW ARRIVALS", items: [
            { label: "WOMEN'S NEW ARRIVALS", to: "/women" },
            { label: "MEN'S NEW ARRIVALS", to: "/men" },
          ]
        }
      ],
    },
    {
      name: "WOMEN",
      to: "/women",
      hoverImage: "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      hoverDetails: [
        {
          section: "SHOES",
          items: [
            { label: "SLIP ON", to: "/women/slip-on" },
            { label: "SANDALS", to: "/women/sandals" },
            { label: "SLING BACK", to: "/women/sling-back" },
            { label: "FLIP FLOP", to: "/women/flip-flop" },
            { label: "COURT SHOES", to: "/women/court-shoes" },
            { label: "PUMPS", to: "/women/pumps" },
          ],
        },
        {
          section: "BAGS",
          items: [
            { label: "SLIP ON", to: "/women/bags/slip-on" },
            { label: "COURT SHOES", to: "/women/bags/court-shoes" },
            { label: "SANDALS", to: "/women/bags/sandals" },
            { label: "SLING BACK", to: "/women/bags/sling-back" },
            { label: "PUMPS", to: "/women/bags/pumps" },
            { label: "FLIP FLOP", to: "/women/bags/flip-flop" },
          ],
        },
      ],
    },
    {
      name: "MEN",
      to: "/men",
      hoverImage: "https://plus.unsplash.com/premium_photo-1723662148369-3dd7abaf0566?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHV0dGluZyUyMG9uJTIwc2hvZXN8ZW58MHx8MHx8fDA%3D",
      hoverDetails: [
        {
          section: "SHOES",
          items: [
            { label: "SLIP ON", to: "/men/slip-on" },
            { label: "SANDALS", to: "/men/sandals" },
            { label: "SLING BACK", to: "/men/sling-back" },
            { label: "FLIP FLOP", to: "/men/flip-flop" },
            { label: "COURT SHOES", to: "/men/court-shoes" },
            { label: "PUMPS", to: "/men/pumps" },
          ],
        },
      ],
    },
    {
      name: "KIDS",
      to: "/kids",
      hoverImage: "https://images.unsplash.com/photo-1636130748629-655be0c60041?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      hoverDetails: [
        {
          section: "GIRLS",
          items: [
            { label: "SANDALS", to: "/kids/girls/sandals" },
            { label: "SLING BACK", to: "/kids/girls/sling-back" },
            { label: "FLIP FLOP", to: "/kids/girls/flip-flop" },
            { label: "COURT SHOES", to: "/kids/girls/court-shoes" },
            { label: "PUMPS", to: "/kids/girls/pumps" },
          ],
        },
        {
          section: "BOYS",
          items: [
            { label: "SANDALS", to: "/kids/boys/sandals" },
            { label: "SLING BACK", to: "/kids/boys/sling-back" },
            { label: "FLIP FLOP", to: "/kids/boys/flip-flop" },
            { label: "COURT SHOES", to: "/kids/boys/court-shoes" },
            { label: "PUMPS", to: "/kids/boys/pumps" },
          ],
        },
      ],
    },
    {
      name: "FRAGRANCES",
      to: "/fragrances",
      hoverDetails: [
        {
          items: [
            { label: "FOR HIM", to: "/fragrances/men" },
            { label: "FOR HER", to: "/fragrances/women" },
            { label: "BODY MIST", to: "/fragrances/body-mist" },
          ]
        },
      ],
    },
    {
      name: "ACCESSORIES",
      to: "/accessories",
      hoverDetails: [],
    },
    {
      name: "GET INSPIRED",
      to: "/getinspired",
      hoverDetails: [
        {
          section: "BOYS",
          items: [
            { label: "SANDALS", to: "/getinspired/boys/sandals" },
            { label: "SLING BACK", to: "/getinspired/boys/sling-back" },
            { label: "FLIP FLOP", to: "/getinspired/boys/flip-flop" },
            { label: "COURT SHOES", to: "/getinspired/boys/court-shoes" },
            { label: "PUMPS", to: "/getinspired/boys/pumps" },
          ],
        },
      ],
    },
    {
      name: "SALES",
      to: "/sales",
      text: "text-red-600",
      hoverDetails: [
        {
          items: [
            { label: "FLAT 50% OFF", to: "/sales/50" },
            { label: "FLAT 70% OFF", to: "/sales/70" },
          ]
        },
      ],
    },
  ];

  const activeLink = activeMenu !== null ? navLinks[activeMenu] : null;
  const isDropdownOpen = activeLink?.hoverDetails?.length > 0;

  return (
    <div
      className="w-full h-[41px] flex justify-center flex-wrap font-sans relative"
      onMouseLeave={() => setActiveMenu(null)}
    >
      {/* links */}
      <div className="flex-1 flex justify-center relative">
        <ul className="relative left-[110px] list-none lg:flex mt-[10px] lg:w-[634.75px] h-[40.9px] flex-wrap justify-center hidden">
          {navLinks.map((link, i) => (
            <li
              key={i}
              className={`relative w-fit font-medium text-[14px] cursor-pointer tracking-[-0.5px] ${
                activeMenu === i ? 'text-black' : 'text-black/70 hover:text-black'
              }`}
              onMouseEnter={() => {
                if (link.hoverDetails?.length > 0) setActiveMenu(i);
                else setActiveMenu(null);
              }}
            >
              <NavLink
                to={link.to}
                className={`block px-[10px] py-[6px] rounded-md transition-colors duration-150 hover:bg-gray-100 ${link.text || ''}`}
              >
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Dropdown panel: always mounted, opacity/pointer-events toggled for smooth transition */}
      <div
        className={`absolute left-[calc(50%-50vw)] top-full w-screen max-w-[100vw] pt-[10px] z-50 transition-all duration-200 ease-out ${
          isDropdownOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="border-t-[0.5px] border-b-[0.5px] border-gray-200 flex flex-row bg-white pt-2 sm:pt-3 max-h-[80vh] overflow-hidden">
          <div className="w-1/2 min-h-0 overflow-y-auto max-h-[80vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-0.5 sm:gap-y-1 pl-3 sm:pl-5 lg:pl-6 pr-4 sm:pr-6 lg:pr-8 mt-1 sm:mt-1.5 lg:mt-[6px] content-start">
              {activeLink?.hoverDetails?.map((section, idx) => (
                <div key={idx} className="mb-2 sm:mb-3 lg:mb-4">
                  {section.section && (
                    <h3 className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold tracking-widest text-black mb-1 sm:mb-1.5 lg:mb-2 uppercase">
                      {section.section}
                    </h3>
                  )}
                  {section.items?.map((item, j) => (
                    <Link
                      key={j}
                      to={item.to}
                      className="text-black/60 hover:text-black/100 font-medium text-[10px] sm:text-[11px] lg:text-[12px] cursor-pointer block mb-[3px] sm:mb-[4px] lg:mb-[5px] whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {activeLink?.hoverImage && (
            <Link
              to={activeLink.to}
              className="w-1/2 min-h-[180px] max-h-[80vh] overflow-hidden shrink-0 block"
            >
              <img
                src={activeLink.hoverImage}
                alt={activeLink.name}
                className="w-full h-full max-h-[80vh] object-cover object-center"
              />
            </Link>
          )}
        </div>
      </div>

      {/* form */}
      <div className=' sx:w-full  lg:w-[220px]  lg:h-[32px] lg:flex lg:justify-start lg:items-center lg:relative lg:top-[17px] '>
        <SearchBar />

        {/* Favourite logo */}
        <Link
          to="/favourite"
          className="hidden lg:block w-[27px] h-[27px] relative lg:left-[4px] lg:top-[-6px] ml-[35px] cursor-pointer"
        >
          <CiHeart className="size-[30px] inline-block" />
        </Link>
        {/* Cart logo */}
        <div className='inline-block size-[25px]  mr-[5px] cursor-pointer relative left-[8px] top-[-7px] '>
          <Link to="/cart"> <span className='hidden lg:block'><svg className='  mr-[6px] size-[25px]' stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" width="25" height="25" xmlns="http://www.w3.org/2000/svg"><path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M80 176a16 16 0 0 0-16 16v216c0 30.24 25.76 56 56 56h272c30.24 0 56-24.51 56-54.75V192a16 16 0 0 0-16-16zm80 0v-32a96 96 0 0 1 96-96h0a96 96 0 0 1 96 96v32"></path></svg></span></Link>
        </div>
      </div>
    </div>

  )
}

export default Navbar