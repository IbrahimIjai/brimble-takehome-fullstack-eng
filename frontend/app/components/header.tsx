import { Rocket } from "lucide-react";

export function Header() {

    return (<header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
                <Rocket className="h-5 w-5 text-foreground" />
                <h1 className="text-sm font-semibold tracking-tight text-foreground">brimble</h1>
            </div>

            <div className="flex items-center gap-3">
                ....
            </div>
        </div>
    </header>)
}