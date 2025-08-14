import { useEffect, useState } from 'react'

interface Props {
    target: Date
    prefix: string
}

export function Countdown({ target, prefix }: Props) {
    const [timeLeft, setTimeLeft] = useState<number>(target.getTime() - Date.now())

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(Math.max(0, target.getTime() - Date.now()))
        }, 1000)

        return () => clearInterval(interval)
    }, [target])

    return (
        <p>
            {prefix} {Math.ceil(timeLeft / 1000)} seconds
        </p>
    )
}
