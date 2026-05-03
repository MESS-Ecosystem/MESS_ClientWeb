import { Bricolage_Grotesque } from 'next/font/google'
import { Link } from "next-transition-router";
import { toggleTheme } from '../Providers/ThemeToggler';

const Grotesque: any = Bricolage_Grotesque({
    preload: true,
})

export default function Header() {
    return (
        <div className="bg-[whitesmoke] dark:bg-zinc-900 dark:text-zinc-200 duration-200 overflow-hidden h-16 w-screen sticky top-0 left-0 flex flex-row flex-wrap justify-between items-center z-60 px-4">
            <div className='max-w-6xl w-full mx-auto flex flex-row flex-wrap justify-between duration-200 items-end text-black dark:text-zinc-200'>
                <Link href={'/'} className={Grotesque.className + ' text-4xl font-semibold upper'}>Mess<p className='text-lg ps-3 inline text-zinc-400'>~withanyone</p></Link>
                <div>
                    <button className='me-2' onClick={toggleTheme}>Toggle Theme</button>
                    <Link href={'/login'} className={Grotesque.className + ' font-normal text-2xl tracking-tight cursor-pointer duration-300 ease-out hover:font-semibold'}>Login</Link>
                </div>
            </div>
        </div>
    )
}