'use client'
import { auth } from "@/lib/auth"
import axios from "axios"
import jwt from "jsonwebtoken"
import { Bricolage_Grotesque, Syne as SyneRaw } from "next/font/google"
import { redirect } from "next/navigation"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import AvatarEditor, { useAvatarEditor } from "react-avatar-editor"
const Grotesque: any = Bricolage_Grotesque({
    preload: true
})
const Syne: any = SyneRaw({
    weight: "400"
})
export default function Page() {
    let token = auth.token()
    let [panel, setPanel] = useState<string>("onboarding")
    let [logoutPanel, setLogoutPanel] = useState<Boolean>(false)
    let [user, setUser] = useState<any>({})
    let [profileImage, setProfileImage] = useState<string>("/placeholder_profiles/placeholder5.png")
    let [editorImage, setEditorImage] = useState<string | File>("/placeholder_profiles/placeholder5.png")
    let [isEditingImage, setIsEditingImage] = useState<Boolean>(false)
    let [isImageLoading, setImageLoading] = useState<Boolean>(false)
    let newUploadRef = useRef<HTMLInputElement>(null)
    const editor = useAvatarEditor()

    useEffect(() => {
        if (!token) {
            setUser({ username: "Anonymous" });
            return;
        }
        setUser(jwt.decode(token))
    }, [token])

    useEffect(() => {
        const imageUrl = user.profile || "/placeholder_profiles/placeholder5.png"
        setProfileImage(imageUrl)
        setEditorImage(imageUrl)
    }, [user.profile])

    const handleUploadImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        setEditorImage(file)
        setProfileImage(URL.createObjectURL(file))
        event.target.value = ""
    }

    const openPanel = (target: string) => {
        console.log(target)
        setPanel(target)
    }

    const handleProfileEdit = () => {
        setIsEditingImage(true)
    }

    const logout = () => {
        auth.clearToken();
        redirect('/')
    }
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
        if (token) (setUser(jwt.decode(token)))
    }
    useEffect(() => {
        refreshToken();
    }, [])

    useEffect(() => {
        setIsEditingImage(false)
        const handleKeyDown = (event: KeyboardEvent) => {
            console.log(event)
            if (event.key === 'Escape') {
                setIsEditingImage(false)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    return (
        <div className='p-10'>
            {/* <h1 className={`${Syne.className} text-5xl dark:text-white font-bold max-w-7xl mx-auto px-5`}>My Account</h1> */}
            <div className={`flex flex-row flex-wrap max-w-7xl mx-auto *:dark:text-white`}>
                <img src={`${user?.profile || "/placeholder_profiles/placeholder5.png"}`} className='max-w-16 aspect-square rounded-full object-cover' alt="" />
                <div className='flex flex-col flex-wrap justify-center'>
                    <p className={`${Syne.className} leading-5 text-3xl px-5`}>{user.username}</p>
                    <p className={`${Syne.className} leading-5 text-lg text-zinc-500 px-5`}>Your personal account</p>
                </div>
            </div>
            <div className='flex flex-col flex-wrap my-5 dark:text-white'>
                <div className='flex flex-row flex-wrap w-full max-w-[1400px] mx-auto'>
                    <ul className='text-2xl tracking-wide flex flex-col flex-wrap p-5 px-7 bg-zinc-100 dark:bg-zinc-800 rounded-2xl basis-1/5'>
                        {[
                            { name: "Account", target: "onboarding" },
                            { name: "Security", target: "security" },
                            { name: "Chats", target: "chat" },
                            { name: "Privacy", target: "termoptions" },
                            { name: "About", target: "info" },
                            { name: "Help & Feedback", target: "help" },
                        ].map((item, index) => {
                            return (
                                <li
                                    className="py-1.5 px-3 pe-10 cursor-pointer font-light hover:font-semibold hover:text-3xl duration-100 hover:tracking-[-0.010]"
                                    key={index}
                                    onClick={() => openPanel(item.target)}
                                >
                                    {item.name}
                                </li>
                            )
                        })}
                    </ul>

                    <div className='p-5 px-24 max-w-full basis-4/5'>
                        <h1 className={`${Syne.className} text-4xl font-semibold pb-5 dark:text-white `}>
                            {(() => {
                                switch (panel) {
                                    case 'onboarding': return "Account"
                                    case 'security': return "Security"
                                    case 'chat': return "Chats"
                                    case 'termoptions': return "Privacy"
                                    case 'info': return "About"
                                    case 'help': return "Help & Feedback"
                                }
                            })()}
                        </h1>
                        <div className='px-10 py-5 border rounded-2xl'>
                            {(() => {
                                switch (panel) {
                                    case 'onboarding': return (
                                        <>
                                            <div>

                                                <h4 className={` ${Grotesque.className} text-3xl font-medium pb-2.5`}>Public Profile</h4>
                                                <div className='flex flex-row flex-wrap items-center justify-between '>
                                                    <div>
                                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 pt-3">
                                                            Username
                                                        </label>
                                                        <input id="username" name="username" type="text" defaultValue={user.username}
                                                            className="px-4 py-3 border rounded-lg focus:outline-none focus:border-black dark:focus:border-white dark:border-black focus:ring-1 focus:ring-black transition-all duration-200 bg-white dark:bg-zinc-700 dark:text-white"
                                                        />
                                                        <label htmlFor="dname" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 pt-3">
                                                            Display name <span className="text-zinc-500">(optional)</span>
                                                        </label>
                                                        <input id="dname" name="dname" type="text" defaultValue={user.displayName}
                                                            className="px-4 py-3 border rounded-lg focus:outline-none focus:border-black dark:focus:border-white dark:border-black focus:ring-1 focus:ring-black transition-all duration-200 bg-white dark:bg-zinc-700 dark:text-white"
                                                        />
                                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 pt-3">
                                                            Email
                                                        </label>
                                                        <input id="email" name="email" type="text" defaultValue={user.email}
                                                            className="px-4 py-3 border rounded-lg focus:outline-none focus:border-black dark:focus:border-white dark:border-black focus:ring-1 focus:ring-black transition-all duration-200 bg-white dark:bg-zinc-700 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <img
                                                            src={profileImage || "/placeholder_profiles/placeholder5.png"}
                                                            alt=""
                                                            className="w-2xs bg-zinc-300/50 rounded-full aspect-square object-cover"
                                                        />
                                                        <div
                                                            className={` ${Syne.className} absolute bottom-4 left-6 cursor-pointer text-xl dark:bg-zinc-900/30 bg-zinc-200/50 text-black dark:text-white backdrop-blur-sm border border-zinc-500 px-4 py-1.5 rounded-lg`}
                                                            onClick={handleProfileEdit}
                                                        >
                                                            Edit
                                                        </div>
                                                    </div>
                                                </div>

                                                <h4 className={` ${Grotesque.className} text-3xl font-medium pb-2.5`}>Session</h4>
                                                <button
                                                    className='bg-red-400 text-white hover:bg-red-600 hover:scale-110 duration-150 cursor-pointer text-2xl rounded-full p-2 px-8  '
                                                    onClick={() => setLogoutPanel(true)}
                                                >Log Out</button>
                                            </div>
                                            {isEditingImage &&
                                                <div
                                                    className='fixed top-0 left-0 w-screen h-screen backdrop-blur-lg'
                                                >
                                                    <div className="absolute top-1/2 left-1/2 -translate-1/2 bg-zinc-100/80 p-10 px-14 rounded-2xl">
                                                        <h1 className={`${Syne.className} text-2xl px-1`}>Edit Profile</h1>
                                                        <div className="rounded-2xl overflow-hidden">
                                                            <AvatarEditor
                                                                ref={editor.ref}
                                                                image={editorImage}
                                                                crossOrigin="anonymous"
                                                                width={550}
                                                                height={550}
                                                                borderRadius={550 / 2}
                                                                backgroundColor="black"
                                                                gridColor="gray"
                                                                // borderColor={[1, 1, 1, 1]}
                                                                showGrid={true}
                                                            />
                                                        </div>
                                                        <input
                                                            ref={newUploadRef}
                                                            type="file"
                                                            id="profile"
                                                            name='profile'
                                                            accept="image/*"
                                                            style={{ display: "none" }}
                                                            onChange={handleUploadImage}
                                                        />
                                                        <button
                                                            className="bg-zinc-700/80 text-white rounded-full px-5 py-2 mx-auto mt-1 w-full cursor-pointer"
                                                            onClick={() => {
                                                                newUploadRef?.current?.click()
                                                            }}
                                                        >
                                                            Upload New Image
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {

                                                                    const canvas = editor.getImageScaledToCanvas()
                                                                    if (canvas) {
                                                                        const dataUrl = canvas.toDataURL()
                                                                        // upload dataUrl to your server
                                                                        console.log(dataUrl)
                                                                        setProfileImage(dataUrl)
                                                                        setImageLoading(true)
                                                                        if (user.profile) {
                                                                            await axios.patch('/api/account/profile', {
                                                                                profile: dataUrl,
                                                                            }, {
                                                                                headers: {
                                                                                    Authorization: `Bearer ${token}`
                                                                                }
                                                                            })
                                                                        } else {
                                                                            await axios.post('/api/account/profile', {
                                                                                profile: dataUrl,
                                                                            }, {
                                                                                headers: {
                                                                                    Authorization: `Bearer ${token}`
                                                                                }
                                                                            })
                                                                        }
                                                                        setImageLoading(false)
                                                                        refreshToken()
                                                                    }
                                                                    setIsEditingImage(false)
                                                                } catch (error) {
                                                                    console.error(error)
                                                                    setImageLoading(false)
                                                                    setTimeout(() => {
                                                                        setIsEditingImage(false)
                                                                    }, 500)
                                                                }
                                                            }}
                                                            className="bg-zinc-700/80 text-white rounded-full px-5 py-2 mx-auto my-1 w-full cursor-pointer"
                                                        >
                                                            {isImageLoading ? "Uploading...." : "Save"}
                                                        </button>
                                                    </div>
                                                </div>
                                            }
                                        </>
                                    )
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>
            {logoutPanel && (
                <div className='absolute top-0 left-0 w-screen h-screen backdrop-blur-sm'>
                    <div className='absolute top-1/2 left-1/2 -translate-1/2 bg-white shadow-2xl rounded-2xl p-12 px-20'>
                        <h5 className={` ${Syne.className} text-5xl`}>Logout</h5>
                        <p className='text-2xl'>Are you Sure to Log Out from this Device ?</p>

                        <div className='flex flex-row flex-wrap pt-7'>

                            <div className='p-0.5 w-1/2'>
                                <button
                                    className='bg-zinc-200 cursor-pointer text-2xl rounded-full p-2 px-8 w-full'
                                    onClick={() => setLogoutPanel(false)}
                                >Cancel</button>
                            </div>
                            <div className='p-0.5 w-1/2'>
                                <button
                                    className='bg-red-400 text-white cursor-pointer text-2xl rounded-full p-2 px-8 w-full'
                                    onClick={logout}
                                >Log Out</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}