'use client'
import { socket } from '../socket'
import gsap from "gsap";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Bricolage_Grotesque } from 'next/font/google'
import MessageBlock from '../Components/MessageBlock';

const Grotesque = Bricolage_Grotesque({
    preload: true,
})


export default function page() {

    // VARIABLES / STATES
    let tl: any; // gsap timeline
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isConnected, setIsConnected] = useState<Boolean>(false);
    const [MessHistory, setMessHistory] = useState<Array<Message>>([])
    const [input, setInput] = useState<userInput>({
        message: '',
        uid: null, // null = anonymous
        displayName: '',
        IsSent: false,
    });





    // INTERFACES (TYPE)
    interface userInput {
        message: string | undefined | number | readonly string[],
        uid: null | string,
        displayName: string,
        IsSent: boolean,
    }

    interface Connection {
        id?: string,
        ref?: 'left' | 'joined',
        platform?: string,
    }

    interface Message {
        message: string | number | readonly string[],
        uid: string | null,
        displayName: string,
        IsSent: boolean,
        connection: Connection | null
    }




    // GSAP ANIMATIONS
    const focusInput = () => {
        if (tl) tl.kill();
        tl = gsap.timeline();
        tl.to(inputRef.current, {
            // fontSize: 24,
            scale: 1.25,
            x: '-15',
            ease: 'expo.out',
            duration: 0.5,
            autoRound: false,
        }, 'sync')
        tl.to('.sendicon', {
            // fontSize: 20,
            scale: 1.2,
            x: '-80%',
            ease: 'back.out(1.7)',
            duration: 0.5,
            autoRound: false,
        }, 'sync')
    }
    const blurInput = () => {
        if (tl) tl.kill();
        tl = gsap.timeline();
        tl.to(inputRef.current, {
            // fontSize: 20,
            scale: 1,
            x: 0,
            ease: 'expo.out',
            duration: 0.5,
            autoRound: false,
        }, 'sync')
        tl.to('.sendicon', {
            // fontSize: 20,
            scale: 1,
            x: 0,
            duration: 0.5,
            ease: 'back.out(1)',
            autoRound: false,
        }, 'sync')
    }

    // EVENT HANDLERS
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInput((prev) => {
            return {
                ...prev,
                message: e.target.value,
            }
        });
    }

    const handleMess = (e: any) => {
        e.preventDefault();
        // console.log(input);
        if (input.message) {

            socket.emit('send-message', input);
            let data: Message = {
                message: input.message.toString(), // raw sanitized            
                displayName: '', // just for now
                uid: '', // will be provided by socketid, will be added later, 
                IsSent: true,
                connection: null, // just for a fallback, not used on server
            }
            setMessHistory(prev => [...prev, data])
            // console.log(MessHistory, data)
            setInput((prev) => {
                return {
                    ...prev,
                    message: '',
                }
            });
        }
    }


    // SOCKET HANDLERS
    function onConnect() {
        setIsConnected(true);
    }
    function onDisconnect() {
        setIsConnected(false);
    }
    function renderNewMessage(data: any) {
        console.log('render data: ', data);
        setMessHistory(prev => [...prev, data])
    }

    // the same thing is already done at server, doing here just for a fallback protection
    function formatPlatform(platform: any) {
        if (!platform) return 'unknown device';
        if (typeof platform === 'string') return platform;
        if (typeof platform === 'object') {
            const label = `${platform.platform ?? ''}${platform.platform && platform.model ? ' ' : ''}${platform.model ?? ''}`.trim();
            return label || JSON.stringify(platform);
        }
        return String(platform);
    }

    function userLeft(data: any) {
        console.log('user left: ', data)
        setMessHistory(prev =>
            [...prev, {
                message: '',
                uid: data?.id,
                displayName: '',
                IsSent: false,
                connection: {...data, ref: 'left', platform: formatPlatform(data?.platform)},
            }]
        )
    }
    function userJoined(data: any) {
        console.log('user joined: ', data)
        setMessHistory(prev =>
            [...prev, {
                message: '',
                uid: data?.id,
                displayName: '',
                IsSent: false,
                connection: {...data, ref: 'joined', platform: formatPlatform(data?.platform)},
            }]
        )

    }

    // SOCKET LISTENERS
    useEffect(() => {
        socket.connect(); // autoconnect is off
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('recieve-new-message', renderNewMessage);
        socket.on('user-left', userLeft);
        socket.on('user-connected', userJoined);
        return () => {
            socket.off('user-left');
            socket.off('user-connected');
            socket.off('recieve-new-message');
            socket.disconnect();
        }
    }, [])


    return (
        <>
            <div className='absolute top-0 right-0 z-60 text-xl capitalize pointer-events-none'>
                <div className={` ${Grotesque.className} ${isConnected ? 'bg-emerald-400' : 'bg-red-300'} ${isConnected ? 'text-emerald-800' : 'text-red-800'} px-3 ps-5 py-1 font-semibold m-3 mt-20 rounded-full flex flex-row flex-wrap items-center justify-evenly gap-1.5`}><div className={`${isConnected ? 'bg-emerald-700' : 'bg-red-700'} w-2 h-2 rounded-full`}>  </div>{isConnected ? 'Connected' : 'Disconnected'}</div>
            </div>

            <div className='mx-auto max-w-2xl mt-24'>
                {MessHistory.map((MESS, KEY) => {
                    return (
                        <div key={KEY}>
                            {MESS.connection ? <div className='text-zinc-800 dark:text-zinc-200 text-center mx-auto'>User <span className='capitalize'>{MESS.connection?.ref}</span> with id: <span className='italic text-zinc-500 dark:text-zinc-400 font-light'>{MESS.connection?.id}</span> from <span className='text-zinc-500 dark:text-zinc-400 font-light'>{formatPlatform(MESS.connection?.platform)}</span></div> :
                                <MessageBlock UserID={MESS.uid} Message={MESS.message} IsSent={MESS.IsSent} ></MessageBlock> 
                            }
                        </div>
                    )
                })}
            </div>

            <form onSubmit={handleMess} className={'fixed bottom-0 md:left-1/2 md:-translate-x-1/2 left-0 mx-auto w-full flex flex-row flex-wrap items-center justify-center mb-5'}>
                <input
                    ref={inputRef}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    type="text"
                    className="bg-zinc-200 rounded-full md:max-w-auto max-w-screen text-xl px-5 py-3"
                    value={input.message}
                    onChange={handleChange}
                />
                <div className="text-black max-w-12 m-0 ms-2 my-auto flex flex-wrap justify-center items-center p-3 bg-zinc-100 rounded-full sendicon" >
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </form>
        </>
    )
}