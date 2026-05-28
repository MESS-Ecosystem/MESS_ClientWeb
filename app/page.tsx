'use client'
// import 
import { Bricolage_Grotesque, Syne as SyneRaw } from 'next/font/google';
import LocomotiveScroll from './Providers/LocomotiveScroll'
import { Link } from 'next-transition-router';
import axios from 'axios';
import { useEffect } from 'react';
import { auth } from '@/lib/auth';
const Grotesque: any = Bricolage_Grotesque({
  preload: true
})
const Syne: any = SyneRaw({
  preload: true
})

export default function Home() {
  let token = auth.token()
  const refreshToken = async () => {
    let res = await axios.get('/api/auth/refresh', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log(res)

    if (res.status == 200) {
      if (res.data.token) auth.setToken(res.data.token)
    }
  }
  useEffect(() => {
    refreshToken();
  }, [])
  return (
    <div className='dark:bg-zinc-900 dark:text-white'>
      <LocomotiveScroll>
        <div className={'w-full h-[90vh] flex flex-col flex-wrap max-w-[88rem] mx-auto justify-center '}>
          <Link href={'/Broadcast'} className={Grotesque.className + ' text-6xl md:text-9xl duration-200 font-bold cursor-pointer wrap-anywhere ps-5'}>Broadcast</Link>
          <div className='max-w-[145px] flex flex-nowrap flex-col'>
            <div className='linebreak dark:bg-white bg-black relative mx-auto'>
              <div className='bg-white dark:bg-zinc-900'>OR</div>
            </div>
          </div>
          <Link href={'/DM'} className={` ${Syne.className} text-4xl font-light ps-6.5 pt-2`}>DM</Link>
        </div>
      </LocomotiveScroll>
    </div>
  );
}
