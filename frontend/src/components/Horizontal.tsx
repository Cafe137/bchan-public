interface Props {
    children: React.ReactNode
    gap?: number
    top?: boolean
    wrap?: boolean
}

export function Horizontal({ children, gap = 16, top, wrap }: Props) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                gap: `${gap}px`,
                alignItems: top ? 'flex-start' : 'center',
                flexWrap: wrap ? 'wrap' : 'nowrap'
            }}
        >
            {children}
        </div>
    )
}
