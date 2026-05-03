'use client'

interface params {
    UserID: String | null,
    Message: string | number | readonly string[],
    IsSent: Boolean | null,
}
export default function MessageBlock({ UserID = null, Message, IsSent = false }: params) {

    return (
        <div className={` ${IsSent ? 'ms-auto enteringanimationonsent' : 'me-auto enteringanimation'} min-w-16 w-fit max-w-1/2 relative mt-6 `}>
            {!IsSent &&
                <div className={'absolute top-0 left-0 ps-2.5 -translate-y-3/4 text-sm text-zinc-600 dark:text-zinc-200'}>anonymous</div>
            }
            <div className={` ${IsSent ? 'bg-emerald-200 ' : 'bg-amber-100 '} text-zinc-900 dark:text-zinc-200 px-5 py-2 m-2 rounded-xl`}>
                <p className={'text-zinc-700 dark:text-zinc-200'}>{UserID?.toString()}</p>
                <p className={'text-3xl text-zinc-900'}>{Message.toString()}</p>
            </div>
        </div>
    )
}