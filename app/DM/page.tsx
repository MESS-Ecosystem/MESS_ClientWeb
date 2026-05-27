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
    const [IsSearching, setIsSearching] = useState<Boolean>(false)
    const [searchedUsers, setSearchedUsers] = useState<any[] | null>([])
    const [notification, setNotification] = useState<any>([])
    // const [searchedUsers, setSearchedUsers] = useState<any[] | null>(null)
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
        profile: string,
        username: string,
        userId: object,
        id: string
    }
    // let [availableUsers, setAvailableUsers] = useState<Array<Object>>([])

    function renderNewMessage(data: any) {
        console.log('render data: ', data.data);
        const nextId = String(data?.uid || data?.id || data?.senderId || '')
        if (nextId) {
            setTypingUsers(prev => prev.filter((user) => user.id !== nextId))
            if (typingTimeoutsRef.current[nextId]) {
                window.clearTimeout(typingTimeoutsRef.current[nextId])
                delete typingTimeoutsRef.current[nextId]
            }
        }
        setMessHistory(prev => [...prev, data.data])
    }

    const handleIsTyping = (payload: any) => {
        if (!payload?.id) return
        const id = String(payload.id)
        const displayName = payload.displayName || payload.username || 'Anonymous'
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

    const handleSearchUser = () => {
        setIsSearching(true);
    }
    const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchedUsers(null)
        if (e.target.value.length >= 3) searchUserOnServer(e.target.value)
        else setSearchedUsers([])
    }

    const handleNotification = (data: any) => {
        console.log('notification: ', data)
        // setNotification((prev: any) => {
        //     return [{
        //         userId: {},
        //         content: data.data.message,
        //         timeStamp: data.data.timeStamp,
        //         username: data.data.username
        //     }, ...prev]
        // })

        setNotification(prev => {

            console.log('PREV:', prev)
            console.log(Array.isArray(prev))

            const next = [

                {
                    userId: {},
                    content: data.data.message,
                    timeStamp: data.data.timestamp,
                    username: data.data.username
                },

                ...prev
            ]

            console.log('NEXT:', next)

            return next
        })
    }

    useEffect(() => {
        console.log("notification: ", notification)
    }, [notification])
    function throttle(func: Function, delay = 1000) {
        let shouldWait = false;
        return function (this: any, ...args: any) {
            if (shouldWait) return; // Ignore calls if we are in the waiting period
            func.apply(this, args); // Execute the function immediately
            shouldWait = true;
            setTimeout(() => {
                shouldWait = false; // Reset the flag after the delay
            }, delay);
        };
    }
    const searchUserOnServer = throttle(async (username: String) => {
        setSearchedUsers(null)
        let searchedUser = await axios.get(`/api/account/search?username=${username}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        console.log(searchedUser)
        setSearchedUsers(searchedUser.data)
    }, 1000)


    // const handleUsername = (e: any) => {
    //     e.preventDefault();
    //     setUsername(e.target.username.value);
    // }


    // Sending Message

    const handleMess = (e: any) => {
        e.preventDefault();
        // console.log(input);
        input.message = input.message?.toString().trim()
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
        socket.emit('chatwith', { username: socket_user.username })
        setMessHistory([])
        socket.emit('get-all-messages');
    }
    const addUserToChatlist = (userInfo: any) => {
        setAvailableUsers(prev => {
            return [{
                username: userInfo.username,
                id: userInfo?.id,
                profile: userInfo.profile,
                email: userInfo.email,
            }, ...prev]
        })
        setIsSearching(false)
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
                        profile: 'placeholder5.png'
                    }]
                )
            } else {
                console.log(users.data);
                const profileusers = users.data?.map((user: any) => ({
                    ...user,
                    profile: `placeholder${Math.floor(Math.random() * 7)}.png`
                }));
                setAvailableUsers(profileusers);
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
        token = auth.token()
        console.log(token)
        if (!token) {
            redirect('/login?redirectTo=DM');
        }
        if (username !== '') {
            const info = getPlatformInfo();
            // eslint-disable-next-line react-hooks/immutability
            socket.auth = { platformInfo: info, username: username, token }
            socket.connect();
            // socket.emit('connectToRoom', { username: username, room: username })
            socket.on('recieve-new-message', renderNewMessage)
            socket.on('dm-notification', handleNotification)
            socket.on('is-typing', handleIsTyping)
            // socket.on('currentroom', currentRoom)
            socket.on('get-all-messages', (messages) => {
                // console.log('older messages: ', messages)
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
            // socket.on('userconnected', (data) => {
            //     console.log(data)
            //     setAvailableUsers(prev => [...prev, {
            //         username: data.username,
            //         id: data?.id,
            //         profile: `placeholder${Math.floor(Math.random() * 7)}.png`,
            //     }])
            // })
        }
        return () => {
            if (username !== '') {
                // socket.off('userconnected')
                socket.off('get-all-messages')
                // socket.off('currentroom')
                socket.off('recieve-new-message')
                socket.off('is-typing', handleIsTyping)
                socket.disconnect();
                stopTypingTicker()
                Object.values(typingTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId))
                typingTimeoutsRef.current = {}
            }
        }
    }, [username, token])



    // useEffect(() => {
    //     const profileUsers = availableUsers.map(user => ({
    //         ...user,
    //         profile: user.profile ?? `placeholder${Math.floor(Math.random() * 7)}.png`
    //     }));

    //     setAvailableUsers(profileUsers);
    // }, [availableUsers]);


    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: 'smooth' })
    }, [MessHistory])

    return (
        <div className='w-screen flex flex-row flex-wrap max-h-[calc(90vh-64px)] ' style={{ minHeight: "calc(100vh - 64px)" }}>

            {IsSearching &&
                <div className='absolute top-0 left-0 backdrop-blur-sm w-screen h-screen z-40'>
                    <div className='bg-white absolute top-1/2 left-1/2 -translate-1/2 rounded-2xl py-10 px-14'>
                        <div className='w-full h-full relative'>
                            <h3 className='text-3xl font-medium'>Find Users</h3>
                            <form className='py-5'>
                                <input
                                    type="text"
                                    name="searchinput"
                                    id="searchinput"
                                    placeholder="username or phone"
                                    className='p-3 rounded-xl text-xl border-2 border-zinc-200 duration-200'
                                    onChange={handleSearchInput}
                                />
                            </form>

                            {searchedUsers === null
                                ?
                                <div className="flex flex-row flex-wrap justify-center items-center bg-zinc-100 rounded-xl p-1.5 px-3">
                                    {/* <img src={''} className='max-w-16 bg-transparent p-1 rounded-full aspect-square object-cover' alt="" /> */}
                                    <div className="w-16 h-16 rounded-full overflow-hidden p-1">
                                        <div className="w-full h-full bg-zinc-300 rounded-full"></div>
                                    </div>
                                    <div className='flex flex-col flex-wrap justify-center gap-2 px-5 py-3 w-[calc(100%-70px)] h-full'>
                                        <div className={`${Grotesque.className} bg-zinc-400 leading-6 w-full h-3 rounded-2xl`}></div>
                                        <div className='bg-zinc-200 text-sm leading-4 w-full h-2 rounded-2xl'></div>
                                    </div>
                                </div>
                                :
                                searchedUsers.map((user, index) => {
                                    return <div
                                        className="flex flex-row flex-wrap bg-zinc-100 rounded-xl p-1.5 px-3 duration-200 *:duration-200 cursor-pointer"
                                        onClick={() => addUserToChatlist(user)}
                                        key={index}
                                    >
                                        <img src={user.profile} className='max-w-16 bg-zinc-500 m-1 rounded-full aspect-square object-cover' alt="" />
                                        <div className='flex flex-col flex-wrap justify-center px-5 py-3'>
                                            <p className={`${Grotesque.className} text-3xl leading-6`}>{user.username}</p>
                                            <p className='text-zinc-500 text-sm leading-4'>{user.phone}</p>
                                        </div>
                                    </div>
                                })}
                            <div className='absolute top-0 right-0 cursor-pointer'
                                onClick={() => {
                                    setIsSearching(false)
                                }}
                            >
                                <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
                                        fill="#000000" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            }


            <div
                className=' text-black dark:text-white duration-150 xl:basis-1/5 lg:basis-2/5 w-full relative p-5 ps-10 max-h-[calc(100vh-64px)]'
                style={{ minHeight: "calc(100vh - 64px)" }}
            >
                <div className='dark:bg-white/20 bg-black/10 w-full h-full p-3 rounded-3xl'>
                    <h3 className={` ${DMSans.className} text-4xl font-light tracking-tight ps-5 pt-3 wrap-anywhere`}>Messages</h3>
                    <div
                        className='flex flex-row flex-wrap items-center justify-between gap-3 bg-white/60 rounded-2xl py-2 px-5 my-2 cursor-pointer'
                        onClick={handleSearchUser}
                    >
                        <p className={`${Grotesque.className} text-xl`}>Find users</p>
                        <img src={`/magnifying-glass.png`} className='max-w-8 bg-transparent' alt="" />
                    </div>
                    <div className='flex flex-col flex-wrap mt-8 gap-2'>
                        {availableUsers.map((user, id) => {
                            return (
                                <div key={id} onClick={() => ChatWithID(user)} className='flex flex-row flex-wrap cursor-pointer items-center justify-between w-full text-xl font-semibold bg-white px-5 py-3 rounded-2xl'>
                                    <div className='flex flex-row flex-wrap items-center gap-5'>
                                        <img src={user.profile} className='max-w-16 bg-zinc-500 rounded-full aspect-square object-cover' alt="" />
                                        <div className='flex flex-col flex-wrap'>
                                            <p>{user.username}</p>
                                            <div className='notify text-sm text-zinc-500'>
                                                {
                                                    (() => {

                                                        const notify = notification.find((notify: any) =>
                                                            notify.username?.toString().toLowerCase() ===
                                                            user.username?.toString().toLowerCase()
                                                        )

                                                        if (!notify) return null

                                                        return notify.content.length > 12
                                                            ? notify.content.substring(0, 12) + '...'
                                                            : notify.content

                                                    })()
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className='bg-emerald-300 text-emerald-700 aspect-square w-8 h-8 text-center flex flex-row flex-wrap justify-center items-center rounded-full text-base font-mono leading-0'>
                                        <p className='mx-auto my-auto p-0'>
                                            {notification.map((notify: any, index: any) => {
                                                if (notify.username.toString().toLowerCase() == user.username.toString().toLowerCase()) {
                                                    return notify.unreadCount
                                                }
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
            <div
                className={` text-black dark:text-white duration-150 xl:basis-4/5 lg:basis-3/5 mx-auto rounded-3xl my-5 px-1 pe-10 overflow-hidden`}
            >
                <div className={`dark:bg-white/20 bg-black/10 w-full h-full max-h-full min-h-full mt-8 p-3 rounded-3xl flex ${selectedChat === null && 'justify-center items-center'} `}>

                    {selectedChat === null ?
                        <h4 className={`text-5xl font-semibold opacity-0 duration-200 ${selectedChat === null && 'opacity-100'} ${Grotesque.className} `}>Select a friend to Chat with </h4>
                        :
                        <div className='w-full h-auto max-h-[calc(100vh-150px)] min-h-[calc(90vh-150px)] relative'>
                            <div className='chat-header w-full h-16 flex flex-row flex-wrap items-center justify-between gap-2 px-5 rounded-2xl text-2xl bg-white '>

                                <div className='flex flex-row flex-wrap items-center'>
                                    <img src={selectedChat.profile} className='max-w-12 bg-zinc-500 rounded-full aspect-square object-cover' alt="" />
                                    <p className='ps-5 font-semibold'>{selectedChat.username}</p>
                                </div>
                                {/* <div className='text-xl font-semibold flex flex-wrap items-center'>
                                    {currentRoomName}
                                </div> */}

                            </div>


                            <div className='mx-auto max-w-2xl pb-24 overflow-y-scroll max-h-[calc(100vh-180px)] min-h-[calc(100vh-180px)]'>
                                {MessHistory.map((MESS, KEY) => {
                                    return (
                                        <div key={KEY}>
                                            <MessageBlock displayName={selectedChat.username} UserID={MESS.uid} Message={MESS.message} isSent={MESS.isSent} ></MessageBlock>
                                        </div>
                                    )
                                })}
                                {typingUsers.length > 0 &&
                                    <div className=' w-fit mb-4 rounded-3xl bg-zinc-100 dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300'>
                                        {typingUsers.map((user) => user.displayName).join(', ')} typing...
                                    </div>
                                }
                                <div className='opacity-0' ref={bottomRef}></div>
                            </div>


                            <form onSubmit={handleMess} className={'absolute bottom-0 md:left-1/2 md:-translate-x-1/2 left-0 mx-auto w-full flex flex-row flex-wrap items-center justify-center '}>
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