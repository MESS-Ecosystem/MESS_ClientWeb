'use client'
import { Bricolage_Grotesque } from 'next/font/google'
import { Link } from "next-transition-router";
import { toggleTheme } from '../Providers/ThemeToggler';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { useEffect, useState } from 'react';

const Grotesque: any = Bricolage_Grotesque({
    preload: true,
})

export default function Header() {

    // let token = auth.token()
    // let username = ''
    // if (token) {
    //     let user: any = jwt.decode(token);
    //     username = user.username
    // }

    const [username, setUsername] = useState('');
    useEffect(() => {
        const updateUser = () => {
            let token = auth.token();
            if (!token) {
                setUsername('');
                return;
            }
            let user: any = jwt.decode(token);
            setUsername(user.username);
        };
        updateUser();
        const unsubscribe = auth.subscribe(updateUser); // passing the function here, that will be called by auth, when the token updates
        return unsubscribe;
    }, []);

    return (
        <div className="bg-[whitesmoke] dark:bg-zinc-900 dark:text-zinc-200 duration-200 overflow-hidden h-16 w-screen sticky top-0 left-0 flex flex-row flex-wrap justify-between items-center z-60 px-4">
            <div className='max-w-6xl w-full mx-auto flex flex-row flex-wrap justify-between duration-200 items-end text-black dark:text-zinc-200'>
                <Link href={'/'} className={Grotesque.className + ' text-4xl font-semibold upper'}>Mess<p className='text-lg ps-3 inline text-zinc-400'>~withanyone</p></Link>
                <div className='flex flex-row flex-wrap items-center gap-4'>
                    {/* <button className='me-2' onClick={toggleTheme}>Toggle Theme</button> */}
                    <img src="/dark-mode.svg" onClick={toggleTheme} alt="" className='h-7 w-7 dark:invert dark:rotate-360 duration-500 ease-out'/>
                    {username ?
                        <div className='flex flex-row flex-wrap gap-2'>
                            <img
                                src={`/placeholder_profiles/placeholder${Math.floor(Math.random() * 7)}.png`}
                                alt=""
                                className='max-w-8 max-h-8 min-h-6 min-w-6 w-auto h-auto rounded-full'
                            />
                            <Link href={'/account'} className={Grotesque.className + ' font-normal text-2xl tracking-tight cursor-pointer duration-300 ease-out hover:font-semibold'}>{username}</Link>
                        </div>
                        :
                        <Link href={'/login'} className={Grotesque.className + ' font-normal text-2xl tracking-tight cursor-pointer duration-300 ease-out hover:font-semibold'}>Login</Link>
                    }
                </div>
            </div>
        </div>
    )
}