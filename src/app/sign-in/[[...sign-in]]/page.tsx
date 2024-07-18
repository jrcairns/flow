import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="min-h-screen flex bg-muted/30 p-2">
            <div className="flex-1 relative flex items-center justify-center">
                <SignIn appearance={{
                    variables: {
                        colorBackground: "black",
                        colorInputBackground: "transparent"
                    }
                }} />
            </div>
            <div className="flex-1 border rounded-md bg-background flex items-center overflow-hidden">
                <div className="p-12 relative">
                    <img className="h-full w-full object-cover" src="/ui.png" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                </div>
            </div>
        </div>
    )
}