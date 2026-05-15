'use client'

interface params {
    UserID: String | null,
    Message: string | number | readonly string[],
    isSent: Boolean | null,
    displayName: String | string
}
export default function MessageBlock({ UserID = null, Message, isSent = false, displayName = 'Anonymous' }: params) {

    return (
        <div className={` ${isSent ? 'ms-auto enteringanimationonsent' : 'me-auto enteringanimation'} min-w-16 w-fit max-w-1/2 relative mt-6 `}>
            {!isSent &&
                <div className={'absolute top-0 left-0 ps-2.5 -translate-y-full text-sm text-zinc-600 dark:text-zinc-200'}>{displayName}</div>
            }
            <div className={` ${isSent ? 'bg-emerald-200 ' : 'bg-amber-100 '} text-zinc-900 dark:text-zinc-200 px-5 ${isSent ? 'pe-4.5' : 'ps-4.5'} py-1.5 m-2 rounded-4xl`}>
                <p className={'text-zinc-700 dark:text-zinc-200'}>{UserID?.toString()}</p>
                <p className={'text-xl text-zinc-900'}>{Message?.toString()}</p>
            </div>
        </div>
    )
}