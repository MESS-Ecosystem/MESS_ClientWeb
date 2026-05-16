'use client';
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import axios from "axios";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { socket } from "../DMSocket";
import gsap from "gsap";
import MessageBlock from "../Components/MessageBlock";
import { auth } from "@/lib/auth";
import jwt from 'jsonwebtoken'
import { redirect } from "next/navigation";
const DMSans: any = DM_Sans({
    preload: true
})
const Grotesque: any = Bricolage_Grotesque({
    preload: true
})

export default function Page() {

    if (!auth.token()) {
        redirect('/login?redirectTo=DM');
    }
    let token = auth.token()

    const tl = useRef<any>(null);
    const [username, setUsername] = useState<string>('')
    // let username: string = ''
    const inputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [MessHistory, setMessHistory] = useState<Array<Message>>([])
    const [typingUsers, setTypingUsers] = useState<Array<TypingUser>>([])
    const [currentRoomName, setCurrentRoomName] = useState<string>('null')
    const [availableUsers, setAvailableUsers] = useState<any[]>([])
    const [selectedChat, setSelectedChat] = useState<null | selectedChatInterface>(null)
    const typingIntervalRef = useRef<number | null>(null)
    const typingTimeoutsRef = useRef<Record<string, number>>({})



    useEffect(() => {
        if (token !== null) {
            type DecodedToken = jwt.JwtPayload & { username?: string }
            const extractedToken = jwt.decode(token) as DecodedToken | null
            if (extractedToken?.username) setUsername(extractedToken.username)
        }
    }, [token])



    const [input, setInput] = useState<userInput>({
        message: '',
        uid: null, // null = anonymous
        displayName: '',
        isSent: false,
    });

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
    interface selectedChatInterface {
        avatar: string,
        username: string,
        userId: object,
        id: string
    }
    // let [availableUsers, setAvailableUsers] = useState<Array<Object>>([])

    function renderNewMessage(data: any) {
        console.log('render data: ', data);
        const nextId = String(data?.uid || data?.id || data?.senderId || '')
        if (nextId) {
            setTypingUsers(prev => prev.filter((user) => user.id !== nextId))
            if (typingTimeoutsRef.current[nextId]) {
                window.clearTimeout(typingTimeoutsRef.current[nextId])
                delete typingTimeoutsRef.current[nextId]
            }
        }
        setMessHistory(prev => [...prev, data])
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
        }, 5000)
    }

    function currentRoom(room: any) {
        console.log('current room: ', room);
        setCurrentRoomName(room.room);
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
    const stopTypingTicker = () => {
        // const bottomRef = useRef<HTMLDivElement | null>(null);
        if (typingIntervalRef.current != null) {
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
        }, 5000)
    }

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

    // const handleUsername = (e: any) => {
    //     e.preventDefault();
    //     setUsername(e.target.username.value);
    // }

    // Sending Message
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

    const ChatWithID = async (socket_user: selectedChatInterface) => {
        // join room with the socketid
        setSelectedChat(socket_user);

        // let sorted = username < socket_user.username 
        let roomID = username < socket_user.username ? `${username}-to-${socket_user.username}` : `${socket_user.username}-to-${username}`
        socket.emit('connectToRoom', { username: username, room: roomID })
        setMessHistory([])

        socket.emit('get-all-messages');
    }
    useEffect(() => {
        const fetchUsers = async () => {
            // using direct get requests, for testing
            // will be changed to specific websocket connection, that only gets status
            let users: any = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/dmusers`)
            console.log('user from DB: ', users)
            // if(users === []) {
            if (users.data == null || users?.data?.length == 0) {
                setAvailableUsers(
                    [{
                        id: 'ANBTHPQDGcmiC2qyAAAJ',
                        username: 'Test User',
                        avatar: 'placeholder5.png'
                    }]
                )
            } else {
                console.log(users.data);
                const avatarusers = users.data?.map((user: any) => ({
                    ...user,
                    avatar: `placeholder${Math.floor(Math.random() * 7)}.png`
                }));
                setAvailableUsers(avatarusers);
            }
        }
        username && fetchUsers();
    }, [username])

    useEffect(() => {
        console.log(availableUsers)
    }, [availableUsers])

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

    useEffect(() => {
        if (username !== '') {
            const info = getPlatformInfo();
            // eslint-disable-next-line react-hooks/immutability
            socket.auth = { platformInfo: info, username: username, token }
            socket.connect();
            socket.emit('connectToRoom', { username: username, room: username })
            socket.on('recieve-new-message', renderNewMessage)
            socket.on('is-typing', handleIsTyping)
            socket.on('currentroom', currentRoom)
            socket.on('get-all-messages', (messages) => {
                console.log('older messages: ', messages)

                let messageArray = messages.map((singlemessage: any) => {
                    return {
                        message: singlemessage.content,
                        uid: '',
                        displayName: '',
                        isSent: username === singlemessage.senderId,
                        connection: null
                    }
                })
                setMessHistory(messageArray);


                // message: string | number | readonly string[],
                // uid: string | null,
                // displayName: string,
                // isSent: boolean,
                // connection: Connection | null

            })
            socket.on('userconnected', (data) => {
                console.log(data)
                setAvailableUsers(prev => [...prev, {
                    username: data.username,
                    id: data?.id,
                    avatar: `placeholder${Math.floor(Math.random() * 7)}.png`,
                }])
            })
        }
        return () => {
            if (username !== '') {
                socket.off('userconnected')
                socket.off('get-all-messages')
                socket.off('currentroom')
                socket.off('recieve-new-message')
                socket.off('is-typing', handleIsTyping)
                socket.disconnect();
                stopTypingTicker()
                Object.values(typingTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId))
                typingTimeoutsRef.current = {}
            }
        }
    }, [])



    // useEffect(() => {
    //     const avatarUsers = availableUsers.map(user => ({
    //         ...user,
    //         avatar: user.avatar ?? `placeholder${Math.floor(Math.random() * 7)}.png`
    //     }));

    //     setAvailableUsers(avatarUsers);
    // }, [availableUsers]);


    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: 'smooth' })
    }, [MessHistory])

    return (
        <div className='w-screen flex flex-row flex-wrap' style={{ minHeight: "calc(100vh - 64px)" }}>


            {/* username (for anonymous users) */}
            {/* {username === '' &&
                <div className='w-screen h-screen absolute z-10 top-1/2 left-1/2 -translate-1/2 flex flex-wrap justify-center items-center bg-white/60 backdrop-blur-sm'>
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
            } */}



            <div
                className=' text-black dark:text-white duration-150 basis-1/5 w-full relative p-5 ps-10'
                style={{ minHeight: "calc(90vh - 64px)" }}
            >
                <div className='dark:bg-white/20 bg-black/10 w-full h-full p-3 rounded-3xl'>
                    <h3 className={` ${DMSans.className} text-4xl font-light tracking-tight ps-5 pt-3`}>Messages</h3>
                    <div className='flex flex-col flex-wrap mt-8 gap-2'>
                        {availableUsers.map((user, id) => {
                            return (
                                <div key={user.id} onClick={() => ChatWithID(user)} className='flex flex-row flex-wrap cursor-pointer items-center gap-5 w-full text-xl font-semibold bg-white px-5 py-3 rounded-2xl'>
                                    <img src={`/placeholder_profiles/${user.avatar}`} className='max-w-12 bg-transparent' alt="" />
                                    {user.username}
                                </div>
                            )
                        })}
                    </div>

                    <div className={` ${Grotesque.className} font-semibold absolute bottom-0 left-0 w-full py-3 -translate-y-1/4 text-center bg-white/50 text-3xl uppercase`}>
                        {username}
                    </div>
                </div>

            </div>
            <div
                className={` text-black dark:text-white duration-150 xl:basis-4/5 lg:basis-3/5 mx-auto rounded-3xl my-5 px-1 pe-10`}
            >
                <div className={`dark:bg-white/20 bg-black/10 w-full h-full p-3 rounded-3xl flex ${selectedChat === null && 'justify-center items-center'} `}>

                    {selectedChat === null ?
                        <h4 className={`text-5xl font-semibold opacity-0 duration-200 ${selectedChat === null && 'opacity-100'} ${Grotesque.className} `}>Select a friend to Chat with </h4>
                        :
                        <div className='w-full h-full relative'>
                            <div className='chat-header w-full h-16 flex flex-row flex-wrap items-center justify-between gap-2 px-5 rounded-2xl text-2xl bg-white '>

                                <div className='flex flex-row flex-wrap items-center'>
                                    <img src={`/placeholder_profiles/${selectedChat.avatar}`} className='max-w-12 bg-transparent object-contain' alt="" />
                                    <p className='ps-5 font-semibold'>{selectedChat.username}</p>
                                </div>
                                <div className='text-xl font-semibold flex flex-wrap items-center'>
                                    {currentRoomName}
                                </div>

                            </div>


                            <div className='mx-auto max-w-2xl mt-24'>
                                {typingUsers.length > 0 &&
                                    <div className='mb-4 rounded-3xl bg-zinc-100 dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300'>
                                        {typingUsers.map((user) => user.displayName).join(', ')} typing...
                                    </div>
                                }
                                {MessHistory.map((MESS, KEY) => {
                                    return (
                                        <div key={KEY}>
                                            <MessageBlock displayName={selectedChat.username} UserID={MESS.uid} Message={MESS.message} isSent={MESS.isSent} ></MessageBlock>
                                        </div>
                                    )
                                })}
                                <div className='opacity-0' ref={bottomRef}></div>
                            </div>


                            <form onSubmit={handleMess} className={'absolute bottom-0 md:left-1/2 md:-translate-x-1/2 left-0 mx-auto w-full flex flex-row flex-wrap items-center justify-center mb-5'}>
                                <input
                                    ref={inputRef}
                                    onFocus={focusInput}
                                    onBlur={blurInput}
                                    type="text"
                                    className="bg-white rounded-full md:max-w-auto max-w-screen text-xl px-5 py-3"
                                    value={input.message}
                                    onChange={handleChange}
                                />
                                <div className="text-black max-w-12 m-0 ms-2 my-auto flex flex-wrap justify-center items-center p-3 bg-zinc-100 rounded-full sendicon" >
                                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </form>
                        </div>
                    }
                </div>

            </div>
        </div>
    )
} 