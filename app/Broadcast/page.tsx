'use client'
import { socket } from '../BroadcastSocket'
import gsap from "gsap";
import { auth } from '@/lib/auth';
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Bricolage_Grotesque } from 'next/font/google'
import MessageBlock from '../Components/MessageBlock';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken'
import axios from 'axios';

const Grotesque = Bricolage_Grotesque({
    preload: true,
})


export default function Page() {

    if (!auth.token()) {
        redirect('/login?redirectTo=Broadcast');
    }
    let token = auth.token()

    // VARIABLES / STATES
    const tl = useRef<any>(null); // gsap timeline
    const inputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [username, setUsername] = useState<string>('')
    const [isConnected, setIsConnected] = useState<boolean | null>(false);
    const [MessHistory, setMessHistory] = useState<Array<Message>>([])
    const [typingUsers, setTypingUsers] = useState<Array<TypingUser>>([])
    const typingIntervalRef = useRef<number | null>(null)
    const typingTimeoutsRef = useRef<Record<string, number>>({})
    const [input, setInput] = useState<userInput>({
        message: '',
        uid: null, // null = anonymous
        displayName: '',
        isSent: false,
    });

    // DECODE JWT TOKEN
    useEffect(() => {
        if (token !== null) {
            type DecodedToken = jwt.JwtPayload & { username?: string }
            const extractedToken = jwt.decode(token) as DecodedToken | null
            if (extractedToken?.username) setUsername(extractedToken.username)
        }
    }, [token])

    // INTERFACES (TYPE)
    interface userInput {
        message: string | undefined | number | readonly string[],
        uid: null | string,
        displayName: string,
        isSent: boolean,
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
        isSent: boolean,
        connection: Connection | null
    }

    interface TypingUser {
        id: string,
        displayName: string,
    }




    // GSAP ANIMATIONS
    const focusInput = () => {
        if (tl.current) tl.current.kill();
        tl.current = gsap.timeline();
        tl.current.to(inputRef.current, {
            // fontSize: 24,
            scale: 1.25,
            x: '-15',
            ease: 'expo.out',
            duration: 0.5,
            autoRound: false,
        }, 'sync')
        tl.current.to('.sendicon', {
            // fontSize: 20,
            scale: 1.2,
            x: '-80%',
            ease: 'back.out(1.7)',
            duration: 0.5,
            autoRound: false,
        }, 'sync')
    }
    const blurInput = () => {
        if (tl.current) tl.current.kill();
        tl.current = gsap.timeline();
        tl.current.to(inputRef.current, {
            // fontSize: 20,
            scale: 1,
            x: 0,
            ease: 'expo.out',
            duration: 0.5,
            autoRound: false,
        }, 'sync')
        tl.current.to('.sendicon', {
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
        const nextValue = e.target.value
        setInput((prev) => {
            return {
                ...prev,
                message: nextValue,
            }
        });
        startTypingTicker(nextValue)
    }

    const stopTypingTicker = () => {
        if (typingIntervalRef.current !== null) {
            window.clearInterval(typingIntervalRef.current)
            typingIntervalRef.current = null
        }
    }

    const sendAmTyping = () => {
        if (!socket || !socket.connected) return;
        if (!username) return;
        socket.emit('am-typing', {
            id: socket.id,
            displayName: username,
        })
    }

    const startTypingTicker = (currentValue: string) => {
        const trimmed = String(currentValue || '').trim()
        if (!trimmed) {
            stopTypingTicker()
            return
        }
        if (typingIntervalRef.current !== null) return
        sendAmTyping()
        typingIntervalRef.current = window.setInterval(() => {
            const current = inputRef.current?.value ?? ''
            if (String(current).trim()) {
                sendAmTyping()
            } else {
                stopTypingTicker()
            }
        }, 500)
    }

    const handleMess = (e: any) => {
        e.preventDefault();
        // console.log(input);
        if (input.message) {

            socket.emit('send-message', input);
            stopTypingTicker()
            let data: Message = {
                message: input.message.toString(), // raw sanitized            
                displayName: '', // just for now
                uid: '', // will be provided by socketid, will be added later, 
                isSent: true,
                connection: null, // just for a fallback, not used on server
            }
            setMessHistory(prev => [...prev, data])
            setInput((prev) => {
                return {
                    ...prev,
                    message: '',
                }
            });
        }
    }

    function retryConnection() {
        console.log('reconnecting...')
        setIsConnected(null);
        const info = getPlatformInfo();
        // eslint-disable-next-line react-hooks/immutability
        socket.auth = { platformInfo: info, username: username, displayName: username, token }
        socket.connect();
        // rest of state handling is managed automatically by socket listeners
    }
    function failedConnection(error: Error) {
        setIsConnected(false);
        if (error.message === "Unauthorized") {
            console.log(error.message)
            localStorage.removeItem("token");
            redirect("/login?redirectTo=Broadcast")
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
        setTypingUsers(prev => prev.filter((user) => user.id !== String(data?.uid || data?.id || '')))
        const nextId = String(data?.uid || data?.id || '')
        if (nextId && typingTimeoutsRef.current[nextId]) {
            window.clearTimeout(typingTimeoutsRef.current[nextId])
            delete typingTimeoutsRef.current[nextId]
        }
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
                isSent: false,
                connection: { ...data, ref: 'left', platform: formatPlatform(data?.platform) },
            }]
        )
    }
    function userJoined(data: any) {
        console.log('user joined: ', data)
        setMessHistory(prev =>
            [...prev, {
                message: '',
                uid: data?.id,
                displayName: data?.displayName,
                isSent: false,
                connection: { ...data, ref: 'joined', platform: formatPlatform(data?.platform) },
            }]
        )

    }

    const handleIsTyping = (payload: any) => {
        if (!payload?.id) return
        const id = String(payload.id)
        const displayName = payload.displayName || 'Anonymous'
        setTypingUsers(prev => {
            if (prev.some(user => user.id === id)) return prev
            return [...prev, { id, displayName }]
        })
        if (typingTimeoutsRef.current[id]) {
            window.clearTimeout(typingTimeoutsRef.current[id])
        }
        typingTimeoutsRef.current[id] = window.setTimeout(() => {
            setTypingUsers(prev => prev.filter(user => user.id !== id))
            delete typingTimeoutsRef.current[id]
        }, 2000)
    }
    // const handleUsername = (e: any) => {
    //     e.preventDefault();
    //     setUsername(e.target.username.value);
    //     setInput((prev) => {
    //         return {
    //             ...prev,
    //             displayName: e.target.username.value,
    //         }
    //     })
    // }


    useEffect(() => {

        bottomRef?.current?.scrollIntoView({ behavior: 'smooth' });

    }, [MessHistory])

    function getPlatformInfo() {
        const userAgent = window.navigator.userAgent;
        const platform = window.navigator.platform;
        console.log(platform)
        if (/Mac/i.test(platform)) return 'Mac OS';
        if (/iPhone|iPad|iPod/i.test(platform)) return 'iOS';
        if (/Win/i.test(platform)) return 'Windows';
        if (/Android/i.test(userAgent)) return 'Android';
        if (/Linux/i.test(platform)) return 'Linux';
        return 'Unknown';
    }

    // confirming user token
    useEffect(() => {
        async function verifySession() {
            let response = await axios.get('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            console.log(response);
        }
    }, [])


    // SOCKET LISTENERS
    useEffect(() => {
        console.log(username)
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'R' && event.shiftKey) {
                if (event.target == inputRef.current) return; // preventing accidental (ui update) refresh while typing
                if (isConnected !== false) {
                    setIsConnected(null)
                    setTimeout(() => {
                        setIsConnected(true)
                        console.log('FOOOLED USER')
                    }, 250)
                }
                else {
                    retryConnection()
                }
            }
        };

        if (username !== '') {
            const info = getPlatformInfo();
            // eslint-disable-next-line react-hooks/immutability
            socket.auth = { platformInfo: info, username: username, displayName: username, token }
            socket.connect(); // autoconnect is off
            setIsConnected(null) // setting connecting state before sending connection request to server
            socket.on('connect', onConnect);
            socket.on('connect_error', failedConnection);
            socket.on('disconnect', onDisconnect);
            socket.on('recieve-new-message', renderNewMessage);
            socket.on('user-left', userLeft);
            socket.on('user-connected', userJoined);
            socket.on('is-typing', handleIsTyping);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            if (username !== '') {
                socket.off('user-left');
                socket.off('user-connected');
                socket.off('recieve-new-message');
                socket.off('is-typing', handleIsTyping);
                socket.disconnect();
                document.removeEventListener('keydown', handleKeyDown);
                stopTypingTicker()
                Object.values(typingTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId))
                typingTimeoutsRef.current = {}
            }
        }
    }, [])

    return (
        <>
            <div
                onClick={retryConnection}
                className='fixed top-0 right-0 z-60 text-xl capitalize pointer-events-none'>
                <div className={` ${Grotesque.className} ${isConnected ? 'bg-emerald-400' : isConnected == null ? 'bg-amber-300 cursor-pointer' : 'bg-red-300 cursor-pointer'} ${isConnected ? 'text-emerald-800' : isConnected == null ? 'text-amber-800' : 'text-red-800'} px-3 ps-5 py-1 font-semibold m-3 mt-20 rounded-full flex flex-row flex-wrap items-center justify-evenly gap-1.5`}>
                    <div className={`${isConnected ? 'bg-emerald-700' : isConnected ? 'bg-amber-700' : 'bg-red-700'} w-2 h-2 rounded-full`}></div>
                    {isConnected ? 'Connected' : isConnected == null ? 'Connecting...' : 'Disconnected'}
                </div>

            </div>
            {/* {username === '' ?
                <div className='w-screen h-screen absolute top-1/2 left-1/2 -translate-1/2 flex flex-wrap justify-center items-center bg-white/60 backdrop-blur-sm'>
                    <form
                        className={` ${Grotesque.className} flex flex-col flex-wrap items-center gap-2.5 bg-white/80 backdrop-blur-xs p-5 rounded-3xl`}
                        onSubmit={handleUsername}
                    >
                        <div>
                            <label htmlFor="username" className='text-3xl font-semibold'>Username: </label>
                            <input type="text" id="username" name="username" className='bg-zinc-100 border border-zinc-300 rounded-2xl py-3 px-6 text-xl' />
                        </div>
                        <input type="submit" value="Chat !" className='bg-zinc-500 text-white text-3xl p-2 w-full cursor-pointer px-4 rounded-2xl mt-2.5' />
                    </form>
                </div>
                : */}
            <>
                <div className='mx-auto max-w-2xl my-24 pb-30'>

                    {MessHistory.map((MESS, KEY) => {
                        return (
                            <div key={KEY}>
                                {MESS.connection ? <div className='text-zinc-800 dark:text-zinc-200 text-center mx-auto'>{MESS.displayName} <span className='capitalize'>{MESS.connection?.ref}</span> with id: <span className='italic text-zinc-500 dark:text-zinc-400 font-light'>{MESS.connection?.id}</span> from <span className='text-zinc-500 dark:text-zinc-400 font-light'>{formatPlatform(MESS.connection?.platform)}</span></div> :
                                    <MessageBlock UserID={MESS.uid} displayName={MESS.displayName} Message={MESS.message} isSent={MESS.isSent} ></MessageBlock>
                                }
                            </div>
                        )
                    })}
                    {typingUsers.length > 0 &&
                        <div className='mb-4 max-w-fit rounded-3xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-200'>
                            {typingUsers.map((user) => user.displayName).join(', ')} typing...
                        </div>
                    }
                    <div className='opacity-0' ref={bottomRef}></div>
                </div>

                <form onSubmit={handleMess} className={'fixed bottom-0 md:left-1/2 md:-translate-x-1/2 left-0 mx-auto w-full flex flex-row flex-wrap items-center justify-center mb-5'}>
                    <input
                        ref={inputRef}
                        onFocus={focusInput}
                        onBlur={blurInput}
                        type="text"
                        className="bg-zinc-200 rounded-full md:max-w-auto max-w-screen text-xl px-5 py-3 pe-15"
                        value={input.message}
                        onChange={handleChange}
                    />
                    <div onClick={handleMess} className="text-black max-w-12 m-0 ms-2 my-auto flex flex-wrap justify-center items-center p-3 bg-zinc-100 rounded-full sendicon" >
                        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </form>
            </>
            {/* } */}
        </>
    )
}