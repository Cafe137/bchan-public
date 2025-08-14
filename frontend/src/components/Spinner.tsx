interface Props {
    depth: number
}

export function Spinner({ depth }: Props) {
    return <img src={`${'../'.repeat(depth)}assets/spinner.gif`} alt="Loading..." className="spinner" />
}
