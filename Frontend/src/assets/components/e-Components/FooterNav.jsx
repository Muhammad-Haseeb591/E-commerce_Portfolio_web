import React from 'react'
import footernav from "../e-Components/Footer"
const FooterNav = () => {
const footernav = "https://res.cloudinary.com/dxqs4sg8j/image/upload/v1783365555/footernav_g7mbdw.jpg";
return (      
  <div className="lg:w-full h-auto sm:h-[197px] bg-cover ">
    <div className='h-[102px] w-full px-[20px] max-[380px]:px-[12px] flex items-center justify-center outline-none backdrop-blur-sm'>
      <h1 className='text-[38px] max-sm:text-[28px] max-[380px]:text-[22px] font-semibold leading-[1.0px] tracking-[1.6px]'>New In</h1>
    </div>
    <div className='lg:w-full h-auto sm:min-h-[95px] bg-[#f5f5f5]/90 backdrop-blur-sm flex items-center py-4 ' style={{backgroundImage: `url(${footernav})`}}>
      <div className='w-full px-[20px] sm:px-[40px] max-[380px]:px-[12px]  lg:px-[90px] border-none flex flex-col sm:flex-row items-center justify-center sm:justify-around gap-4' >
        <h2 className='w-full sm:w-auto text-center sm:text-left text-[16px] sm:text-[20px] max-[380px]:text-[14px] font-medium leading-[-0.10px] font-sans'>
          SUBSCRIBE TO OUR NEWSLETTER
        </h2>
        <form action="/submit" className='bg-white w-full sm:w-[440px] h-[45px] max-[380px]:h-[40px] flex items-center rounded-[10px] appearance-none shadow-sm shadow-gray-500 box-border'> 
          <input 
            type="email" 
            placeholder='Enter your email address' 
            className=' block w-full py-[15px] pl-[15px] pr-[50px] max-[380px]:pl-[10px] max-[380px]:pr-[30px] placeholder:text-black/60 text-[13px] max-[380px]:text-[11px] h-[45px] max-[380px]:h-[40px] overflow-hidden tracking-[-0.5px] focus:outline-none' 
          />
          <button 
            type='submit' 
            className='text-white w-40 max-[380px]:w-28 h-[49px] max-[380px]:h-[40px] max-[380px]:text-[12px] cursor-pointer bg-gradient-to-b from-[#636363] z-50 overflow-visible rounded-r-[10px] to-[#3b3b3b] to-30% flex-shrink-0'
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  </div>
)
}

export default FooterNav