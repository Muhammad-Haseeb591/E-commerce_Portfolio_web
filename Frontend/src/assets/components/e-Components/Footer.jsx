import React from 'react'
 import { useState } from 'react'

const Footer = () => {
     const [customerCareOpen, setCustomerCareOpen] = useState(false);
  const [aboutUsOpen, setAboutUsOpen] = useState(false);
 return (
    <div className='bg-[#333333] md:h-[411.3px] min-h-fit md:w-full pt-[48px] box-border relative bottom-0'>
      <div className='md:h-[306px] w-full px-[20px] sm:px-[50px] pb-[50px] flex max-md:flex-col justify-between md:gap-0 max-md:gap-8'>
        
        {/* CUSTOMER CARE */}
        <div className='md:w-[387.12px] max-md:w-full'>
          <div className='flex justify-between items-center mb-[5px]'>
            <h3 className='text-white text-[14px] font-medium'>CUSTOMER CARE</h3>
            <button 
              onClick={() => setCustomerCareOpen(!customerCareOpen)}
              className='md:hidden text-white text-[20px] w-[24px] h-[24px] flex items-center justify-center transition-transform duration-200'
              aria-label="Toggle Customer Care"
            >
              {customerCareOpen ? '−' : '+'}
            </button>
          </div>
          <ul className={`list-none text-white/65 [&>li]:text-[14px] justify-start grid grid-cols-1 [&>li]:my-[7px] [&>li]:inline-block transition-all duration-300 overflow-hidden ${customerCareOpen ? 'max-md:max-h-[500px] max-md:opacity-100' : 'max-md:max-h-0 max-md:opacity-0'} md:max-h-none md:opacity-100`}>
            <li><a href="" className='hover:underline hover:text-white'>Contact us</a></li>
            <li><a href="" className='hover:underline hover:text-white'>About us</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Career</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Blogs</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Order tracking</a></li>
          </ul>
        </div>

        {/* ABOUT US */}
        <div className='md:w-[387.12px] max-md:w-full'>
          <div className='flex justify-between items-center mb-[5px]'>
            <h3 className='text-white text-[14px] font-medium'>ABOUT US</h3>
            <button 
              onClick={() => setAboutUsOpen(!aboutUsOpen)}
              className='md:hidden text-white text-[20px] w-[24px] h-[24px] flex items-center justify-center transition-transform duration-200'
              aria-label="Toggle About Us"
            >
              {aboutUsOpen ? '−' : '+'}
            </button>
          </div>
          <ul className={`list-none text-white/65 [&>li]:text-[14px] justify-start grid grid-cols-1 [&>li]:my-[7px] [&>li]:inline-block transition-all duration-300 overflow-hidden ${aboutUsOpen ? 'max-md:max-h-[500px] max-md:opacity-100' : 'max-md:max-h-0 max-md:opacity-0'} md:max-h-none md:opacity-100`}>
            <li><a href="" className='hover:underline hover:text-white'>Customer service</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Privacy policy</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Return & exchange policy</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Customer claim policy</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Order tracking</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Shipping & handling policy</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Store locator</a></li>
            <li><a href="" className='hover:underline hover:text-white'>Terms & conditions</a></li>
          </ul>
        </div>

        {/* WE SAY / CONTACT INFO */}
        <div className='md:w-[387.12px] max-md:w-full min-h-[150px] grid grid-rows-4 items-start gap-4'>
          <div className='w-full h-[30px] flex items-center'>
            <span className='size-[20px] flex-shrink-0'>
              <a href="">
                <img src="https://cdn.shopify.com/s/files/1/0490/2443/4341/files/telephone_3692d459-6077-4f47-b186-64898a5aef44.png?v=1693980443" alt="get in touch" />
              </a>
            </span>
            <span className='ml-[20px] flex flex-col'>
              <a href='tel:042111456788' className='text-white/60 text-[14px]'>042 111 456 788</a>
              <a href='tel:+923700071270' className='text-white/60 text-[14px]'>+92 370 007 1270</a>
            </span>
          </div>

          <div className='w-full h-[20px] flex items-center'>
            <a href="" className='size-[20px] flex-shrink-0'>
              <img src="https://cdn.shopify.com/s/files/1/0490/2443/4341/files/mail.png?v=1693980443" alt="Mail to" />
            </a>
            <a href="mailto:support@insignia.com.pk" className='text-white/60 ml-[20px] text-[14px] break-all'>support@insignia.com.pk</a>
          </div>

          <div className='w-full min-h-[20px] flex items-start'>
            <a href="" className='size-[20px] flex-shrink-0 mt-1'>
              <img src="https://cdn.shopify.com/s/files/1/0490/2443/4341/files/location_pin_white_bg_20x20_7d537c77-df5e-44fb-b8a2-06b6cc9fd861.png?v=1747114533" alt="Location" />
            </a>
            <span className='text-white/60 ml-[20px] text-[14px] leading-5'>47 B2, Gulleberg, Lahore, Punjab, Pakistan</span>
          </div>

          <div className='grid grid-cols-5 max-w-[250px] [&>a]:items-center [&>a]:hover:scale-110 [&>a]:transition-all [&>a]:duration-150 [&>a]:ease-in-out h-[20px]'>
            <a href="" className='size-[44px]'>
              <svg aria-hidden="true" focusable="false" className="icon icon-facebook size-[18px] fill-white" viewBox="0 0 18 18">
                <path d="M16.42.61c.27 0 .5.1.69.28.19.2.28.42.28.7v15.44c0 .27-.1.5-.28.69a.94.94 0 01-.7.28h-4.39v-6.7h2.25l.31-2.65h-2.56v-1.7c0-.4.1-.72.28-.93.18-.2.5-.32 1-.32h1.37V3.35c-.6-.06-1.27-.1-2.01-.1-1.01 0-1.83.3-2.45.9-.62.6-.93 1.44-.93 2.53v1.97H7.04v2.65h2.24V18H.98c-.28 0-.5-.1-.7-.28a.94.94 0 01-.28-.7V1.59c0-.27.1-.5.28-.69a.94.94 0 01.7-.28h15.44z"></path>
              </svg>
            </a>

            <a href="" className='size-[44px]'>
              <svg aria-hidden="true" focusable="false" className="size-[18px] fill-white icon icon-instagram" viewBox="0 0 18 18">
                <path d="M8.77 1.58c2.34 0 2.62.01 3.54.05.86.04 1.32.18 1.63.3.41.17.7.35 1.01.66.3.3.5.6.65 1 .12.32.27.78.3 1.64.05.92.06 1.2.06 3.54s-.01 2.62-.05 3.54a4.79 4.79 0 01-.3 1.63c-.17.41-.35.7-.66 1.01-.3.3-.6.5-1.01.66-.31.12-.77.26-1.63.3-.92.04-1.2.05-3.54.05s-2.62 0-3.55-.05a4.79 4.79 0 01-1.62-.3c-.42-.16-.7-.35-1.01-.66-.31-.3-.5-.6-.66-1a4.87 4.87 0 01-.3-1.64c-.04-.92-.05-1.2-.05-3.54s0-2.62.05-3.54c.04-.86.18-1.32.3-1.63.16-.41.35-.7.66-1.01.3-.3.6-.5 1-.65.32-.12.78-.27 1.63-.3.93-.05 1.2-.06 3.55-.06zm0-1.58C6.39 0 6.09.01 5.15.05c-.93.04-1.57.2-2.13.4-.57.23-1.06.54-1.55 1.02C1 1.96.7 2.45.46 3.02c-.22.56-.37 1.2-.4 2.13C0 6.1 0 6.4 0 8.77s.01 2.68.05 3.61c.04.94.2 1.57.4 2.13.23.58.54 1.07 1.02 1.56.49.48.98.78 1.55 1.01.56.22 1.2.37 2.13.4.94.05 1.24.06 3.62.06 2.39 0 2.68-.01 3.62-.05.93-.04 1.57-.2 2.13-.41a4.27 4.27 0 001.55-1.01c.49-.49.79-.98 1.01-1.56.22-.55.37-1.19.41-2.13.04-.93.05-1.23.05-3.61 0-2.39 0-2.68-.05-3.62a6.47 6.47 0 00-.4-2.13 4.27 4.27 0 00-1.02-1.55A4.35 4.35 0 0014.52.46a6.43 6.43 0 00-2.13-.41A69 69 0 008.77 0z"></path>
                <path d="M8.8 4a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.43a2.92 2.92 0 110-5.85 2.92 2.92 0 010 5.85zM13.43 5a1.05 1.05 0 100-2.1 1.05 1.05 0 000 2.1z"></path>
              </svg>
            </a>

            <a href="" className='size-[44px]'>
              <svg aria-hidden="true" focusable="false" className="icon icon-youtube size-[18px] fill-white" viewBox="0 0 100 70">
                <path d="M98 11c2 7.7 2 24 2 24s0 16.3-2 24a12.5 12.5 0 01-9 9c-7.7 2-39 2-39 2s-31.3 0-39-2a12.5 12.5 0 01-9-9c-2-7.7-2-24-2-24s0-16.3 2-24c1.2-4.4 4.6-7.8 9-9 7.7-2 39-2 39-2s31.3 0 39 2c4.4 1.2 7.8 4.6 9 9zM40 50l26-15-26-15v30z"></path>
              </svg>
            </a>

            <a href="" className='size-[44px]'>
              <svg aria-hidden="true" focusable="false" className="fill-white size-[18px] icon icon-tiktok" width="16" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.02 0H11s-.17 3.82 4.13 4.1v2.95s-2.3.14-4.13-1.26l.03 6.1a5.52 5.52 0 11-5.51-5.52h.77V9.4a2.5 2.5 0 101.76 2.4L8.02 0z"></path>
              </svg>
            </a>

            <a href="" className='size-[44px]'>
              <svg aria-hidden="true" focusable="false" className="size-[18px] fill-white icon icon-pinterest" viewBox="0 0 17 18">
                <path d="M8.48.58a8.42 8.42 0 015.9 2.45 8.42 8.42 0 011.33 10.08 8.28 8.28 0 01-7.23 4.16 8.5 8.5 0 01-2.37-.32c.42-.68.7-1.29.85-1.8l.59-2.29c.14.28.41.52.8.73.4.2.8.31 1.24.31.87 0 1.65-.25 2.34-.75a4.87 4.87 0 001.6-2.05 7.3 7.3 0 00.56-2.93c0-1.3-.5-2.41-1.49-3.36a5.27 5.27 0 00-3.8-1.43c-.93 0-1.8.16-2.58.48A5.23 5.23 0 002.85 8.6c0 .75.14 1.41.43 1.98.28.56.7.96 1.27 1.2.1.04.19.04.26 0 .07-.03.12-.1.15-.2l.18-.68c.05-.15.02-.3-.11-.45a2.35 2.35 0 01-.57-1.63A3.96 3.96 0 018.6 4.8c1.09 0 1.94.3 2.54.89.61.6.92 1.37.92 2.32 0 .8-.11 1.54-.33 2.21a3.97 3.97 0 01-.93 1.62c-.4.4-.87.6-1.4.6-.43 0-.78-.15-1.06-.47-.27-.32-.36-.7-.26-1.13a111.14 111.14 0 01.47-1.6l.18-.73c.06-.26.09-.47.09-.65 0-.36-.1-.66-.28-.89-.2-.23-.47-.35-.83-.35-.45 0-.83.2-1.13.62-.3.41-.46.93-.46 1.56a4.1 4.1 0 00.18 1.15l.06.15c-.6 2.58-.95 4.1-1.08 4.54-.12.55-.16 1.2-.13 1.94a8.4 8.4 0 01-5-7.65c0-2.3.81-4.28 2.44-5.9A8.04 8.04 0 018.48.57z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className='md:w-full md:h-[36px] outline-white/10 outline mt-[20px] text-[13px]'>
        <div className='w-full h-[36px] px-[20px] sm:px-[50px] text-white/60 flex justify-center items-center font-sans text-center'>
          &copy; 2025, <a className='hover:underline hover:text-white font-sans ml-1' href="./insignia.com.pk">Insignia PK.</a>
        </div>
      </div>
    </div>
  )
}

export default Footer